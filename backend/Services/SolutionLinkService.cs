using System.Text.Json;
using System.Text.Json.Serialization;
using MonadicStudio.Api.Models;

namespace MonadicStudio.Api.Services;

public sealed class SolutionLinkService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly string _settingsPath;
    private readonly IConfiguration _configuration;
    private SolutionSettings _cached;

    public SolutionLinkService(IWebHostEnvironment environment, IConfiguration configuration)
    {
        _configuration = configuration;
        var dir = Path.Combine(environment.ContentRootPath, "pipelines");
        Directory.CreateDirectory(dir);
        _settingsPath = Path.Combine(dir, "solution-link.json");
        _cached = LoadFromDisk() ?? LoadFromAppSettings() ?? new SolutionSettings(null, null, null);
    }

    public SolutionSettings GetSettings() => _cached;

    public SolutionSettings Link(SolutionLinkRequest request)
    {
        if (!File.Exists(request.ProjectPath) && !Directory.Exists(request.ProjectPath))
            throw new InvalidOperationException($"Path non trovato: {request.ProjectPath}");

        var projectPath = ResolveProjectPath(request.ProjectPath);
        var outputDir = request.OutputDirectory ?? SuggestOutputDirectory(projectPath);
        var ns = request.RootNamespace ?? SuggestNamespace(projectPath);
        var workspaceRoot = Directory.Exists(request.ProjectPath) && !request.ProjectPath.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase)
            ? Path.GetFullPath(request.ProjectPath)
            : FindWorkspaceRoot(projectPath);

        _cached = new SolutionSettings(
            projectPath,
            outputDir,
            ns,
            string.IsNullOrWhiteSpace(request.OutputFileName) ? "GeneratedPipeline.cs" : request.OutputFileName,
            workspaceRoot);

        SaveToDisk(_cached);
        return _cached;
    }

    public SolutionSettings BootstrapWorkspace(string workspaceRoot)
    {
        var discovered = Discover(workspaceRoot);
        if (!discovered.Found || string.IsNullOrWhiteSpace(discovered.ProjectPath))
            throw new InvalidOperationException(discovered.Message ?? "Impossibile collegare il workspace");

        return Link(new SolutionLinkRequest(
            discovered.ProjectPath,
            discovered.SuggestedOutputDirectory,
            discovered.SuggestedNamespace));
    }

    public string? GetWorkspacePipelineDirectory()
    {
        if (string.IsNullOrWhiteSpace(_cached.WorkspaceRoot))
            return null;

        var dir = Path.Combine(_cached.WorkspaceRoot, ".monadicstudio");
        Directory.CreateDirectory(dir);
        return dir;
    }

    public SolutionDiscoverResponse Discover(string directoryPath)
    {
        if (!Directory.Exists(directoryPath))
            return new SolutionDiscoverResponse(false, null, null, null, "Directory non trovata");

        var manifest = Path.Combine(directoryPath, "monadicstudio.json");
        if (File.Exists(manifest))
        {
            var fromManifest = JsonSerializer.Deserialize<SolutionSettings>(File.ReadAllText(manifest), JsonOptions);
            if (fromManifest?.ProjectPath is not null)
            {
                var projectPath = Path.GetFullPath(Path.Combine(directoryPath, fromManifest.ProjectPath));
                return new SolutionDiscoverResponse(
                    true,
                    projectPath,
                    ResolveOutputDir(directoryPath, fromManifest.OutputDirectory, projectPath),
                    fromManifest.RootNamespace,
                    "Trovato monadicstudio.json");
            }
        }

        var sln = Directory.GetFiles(directoryPath, "*.sln", SearchOption.TopDirectoryOnly).FirstOrDefault();
        if (sln is not null)
        {
            var csproj = Directory.GetFiles(directoryPath, "*.csproj", SearchOption.AllDirectories)
                .FirstOrDefault(p => !p.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")
                                  && !p.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}"));

            if (csproj is null)
                return new SolutionDiscoverResponse(false, null, null, null, "Nessun .csproj nella solution");

            return new SolutionDiscoverResponse(
                true,
                csproj,
                SuggestOutputDirectory(csproj),
                SuggestNamespace(csproj),
                $"Trovato {Path.GetFileName(sln)}");
        }

        var directCsproj = Directory.GetFiles(directoryPath, "*.csproj", SearchOption.TopDirectoryOnly).FirstOrDefault();
        if (directCsproj is not null)
            return new SolutionDiscoverResponse(
                true,
                directCsproj,
                SuggestOutputDirectory(directCsproj),
                SuggestNamespace(directCsproj),
                "Trovato .csproj");

        return new SolutionDiscoverResponse(false, null, null, null, "Nessuna solution o progetto trovato");
    }

    public string ExportCode(string code)
    {
        if (string.IsNullOrWhiteSpace(_cached.OutputDirectory))
            throw new InvalidOperationException("OutputDirectory non configurato — collega una solution");

        Directory.CreateDirectory(_cached.OutputDirectory);
        var filePath = Path.Combine(_cached.OutputDirectory, _cached.OutputFileName);
        File.WriteAllText(filePath, code);
        return filePath;
    }

    private SolutionSettings? LoadFromDisk()
    {
        if (!File.Exists(_settingsPath))
            return null;

        return JsonSerializer.Deserialize<SolutionSettings>(File.ReadAllText(_settingsPath), JsonOptions);
    }

    private void SaveToDisk(SolutionSettings settings)
    {
        File.WriteAllText(_settingsPath, JsonSerializer.Serialize(settings, JsonOptions));
    }

    private SolutionSettings? LoadFromAppSettings()
    {
        var path = _configuration["Solution:ProjectPath"];
        if (string.IsNullOrWhiteSpace(path))
            return null;

        return new SolutionSettings(
            path,
            _configuration["Solution:OutputDirectory"],
            _configuration["Solution:RootNamespace"]);
    }

    private static string? FindWorkspaceRoot(string projectPath)
    {
        var dir = Path.GetDirectoryName(projectPath);
        while (!string.IsNullOrWhiteSpace(dir))
        {
            if (Directory.GetFiles(dir, "*.sln").Length > 0 || File.Exists(Path.Combine(dir, "monadicstudio.json")))
                return dir;

            var parent = Directory.GetParent(dir)?.FullName;
            if (parent == dir) break;
            dir = parent;
        }

        return Path.GetDirectoryName(projectPath);
    }

    private static string ResolveProjectPath(string path)
    {
        if (path.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".sln", StringComparison.OrdinalIgnoreCase))
            return Path.GetFullPath(path);

        if (Directory.Exists(path))
        {
            var csproj = Directory.GetFiles(path, "*.csproj", SearchOption.AllDirectories)
                .FirstOrDefault(p => !p.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")
                                  && !p.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}"));
            if (csproj is not null)
                return csproj;
        }

        return Path.GetFullPath(path);
    }

    private static string SuggestOutputDirectory(string projectPath)
    {
        var projectDir = Path.GetDirectoryName(projectPath) ?? projectPath;
        return Path.Combine(projectDir, "Pipelines");
    }

    private static string? SuggestNamespace(string projectPath)
    {
        try
        {
            var projectDir = Path.GetDirectoryName(projectPath);
            if (projectDir is null)
                return null;

            var dirName = Path.GetFileName(projectDir);
            return $"{dirName}.Pipelines";
        }
        catch
        {
            return null;
        }
    }

    private static string ResolveOutputDir(string baseDir, string? relativeOrAbsolute, string projectPath)
    {
        if (string.IsNullOrWhiteSpace(relativeOrAbsolute))
            return SuggestOutputDirectory(projectPath);

        return Path.IsPathRooted(relativeOrAbsolute)
            ? relativeOrAbsolute
            : Path.GetFullPath(Path.Combine(baseDir, relativeOrAbsolute));
    }
}
