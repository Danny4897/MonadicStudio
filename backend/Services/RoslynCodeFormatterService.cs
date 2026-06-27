using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Formatting;

namespace MonadicStudio.Api.Services;

public sealed class RoslynCodeFormatterService
{
    public (string FormattedCode, IReadOnlyList<string> Diagnostics, bool IsValid) FormatAndValidate(string code)
    {
        var tree = CSharpSyntaxTree.ParseText(code);
        var diagnostics = tree.GetDiagnostics()
            .Select(d => $"{d.Severity}: {d.GetMessage()}")
            .ToList();

        var isValid = !diagnostics.Any(d => d.StartsWith("Error:", StringComparison.OrdinalIgnoreCase));

        var root = tree.GetRoot();
        var formatted = Formatter.Format(root, new AdhocWorkspace()).ToFullString();

        return (formatted, diagnostics, isValid);
    }
}
