using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using MonadicStudio.Api.Models;

namespace MonadicStudio.Api.Services;

public sealed class SolutionExplorerService
{
    private readonly SolutionLinkService _solutionLink;

    public SolutionExplorerService(SolutionLinkService solutionLink)
    {
        _solutionLink = solutionLink;
    }

    public SolutionTreeResponse GetTree()
    {
        var path = _solutionLink.GetSettings().ProjectPath;
        if (string.IsNullOrWhiteSpace(path))
            return BuildFallback();

        try
        {
            var files = ResolveCsFiles(path);
            if (files.Count == 0)
                return BuildFallback();

            var classes = ParseFiles(files);
            if (classes.Count == 0)
                return BuildFallback();

            return new SolutionTreeResponse(path, false, classes);
        }
        catch
        {
            return BuildFallback();
        }
    }

    private static IReadOnlyList<string> ResolveCsFiles(string path)
    {
        if (path.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase))
        {
            var dir = Path.GetDirectoryName(path) ?? path;
            return EnumerateCsFiles(dir);
        }

        if (path.EndsWith(".sln", StringComparison.OrdinalIgnoreCase))
        {
            var slnDir = Path.GetDirectoryName(path) ?? ".";
            var projects = Directory.GetFiles(slnDir, "*.csproj", SearchOption.AllDirectories)
                .Where(p => !p.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")
                         && !p.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}"))
                .SelectMany(p => EnumerateCsFiles(Path.GetDirectoryName(p)!))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            return projects;
        }

        if (Directory.Exists(path))
            return EnumerateCsFiles(path);

        return [];
    }

    private static List<string> EnumerateCsFiles(string directory) =>
        Directory.GetFiles(directory, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")
                     && !f.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}"))
            .ToList();

    private static IReadOnlyList<SolutionClass> ParseFiles(IReadOnlyList<string> files)
    {
        var map = new Dictionary<string, List<SolutionMethod>>(StringComparer.Ordinal);

        foreach (var file in files)
        {
            var text = File.ReadAllText(file);
            var tree = CSharpSyntaxTree.ParseText(text);
            var root = tree.GetCompilationUnitRoot();

            foreach (var classDecl in root.DescendantNodes().OfType<ClassDeclarationSyntax>())
            {
                var className = classDecl.Identifier.Text;
                var ns = GetNamespace(classDecl);

                foreach (var method in classDecl.Members.OfType<MethodDeclarationSyntax>())
                {
                    if (!IsPipelineCandidate(method))
                        continue;

                    var input = FormatInputType(method);
                    var output = method.ReturnType.ToString();

                    if (!map.TryGetValue($"{ns}.{className}", out var methods))
                    {
                        methods = [];
                        map[$"{ns}.{className}"] = methods;
                    }

                    methods.Add(new SolutionMethod(
                        method.Identifier.Text,
                        input,
                        output,
                        method.Modifiers.Any(SyntaxKind.StaticKeyword)));
                }
            }
        }

        return map
            .Select(kv =>
            {
                var dot = kv.Key.LastIndexOf('.');
                var ns = dot > 0 ? kv.Key[..dot] : string.Empty;
                var name = dot > 0 ? kv.Key[(dot + 1)..] : kv.Key;
                return new SolutionClass(name, ns, kv.Value.OrderBy(m => m.Name).ToList());
            })
            .Where(c => c.Methods.Count > 0)
            .OrderBy(c => c.Namespace)
            .ThenBy(c => c.Name)
            .ToList();
    }

    private static bool IsPipelineCandidate(MethodDeclarationSyntax method)
    {
        if (method.Modifiers.Any(SyntaxKind.PrivateKeyword))
            return false;

        var name = method.Identifier.Text;
        if (name is "Main" or "ToString" or "GetHashCode" or "Equals")
            return false;

        return method.ParameterList.Parameters.Count <= 2;
    }

    private static string FormatInputType(MethodDeclarationSyntax method)
    {
        var parameters = method.ParameterList.Parameters;
        if (parameters.Count == 0)
            return "void";

        if (parameters.Count == 1)
            return parameters[0].Type?.ToString() ?? "object";

        return string.Join(", ", parameters.Select(p => p.Type?.ToString() ?? "object"));
    }

    private static string GetNamespace(SyntaxNode node)
    {
        for (var current = node.Parent; current is not null; current = current.Parent)
        {
            if (current is NamespaceDeclarationSyntax ns)
                return ns.Name.ToString();

            if (current is FileScopedNamespaceDeclarationSyntax fileNs)
                return fileNs.Name.ToString();
        }

        return string.Empty;
    }

    private static SolutionTreeResponse BuildFallback() =>
        new(
            null,
            true,
            [
                new SolutionClass(
                    "RequestValidator",
                    "MyApp.Application",
                    [
                        new SolutionMethod("ValidateRequest", "Request", "Result<Request>", true),
                    ]),
                new SolutionClass(
                    "UserRepository",
                    "MyApp.Infrastructure",
                    [
                        new SolutionMethod("SaveToDb", "User", "Result<User>", true),
                        new SolutionMethod("FindById", "Guid", "Result<User>", true),
                    ]),
                new SolutionClass(
                    "UserMapper",
                    "MyApp.Application",
                    [
                        new SolutionMethod("ToDomain", "DbUser", "Result<User>", true),
                    ]),
            ]);
}
