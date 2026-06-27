using System.Text.Json;
using System.Text.Json.Serialization;
using MonadicStudio.Api.Models;

namespace MonadicStudio.Api.Services;

public sealed class PipelinePersistenceService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly string _fallbackDirectory;
    private readonly SolutionLinkService _solutionLink;

    public PipelinePersistenceService(IWebHostEnvironment environment, SolutionLinkService solutionLink)
    {
        _solutionLink = solutionLink;
        _fallbackDirectory = Path.Combine(environment.ContentRootPath, "pipelines");
        Directory.CreateDirectory(_fallbackDirectory);
    }

    public async Task<PipelineDocument?> LoadAsync(string name = "default", CancellationToken cancellationToken = default)
    {
        var path = GetPath(name);
        if (!File.Exists(path))
            return null;

        await using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<PipelineDocument>(stream, JsonOptions, cancellationToken);
    }

    public async Task<PipelineDocument> SaveAsync(PipelineDocument document, CancellationToken cancellationToken = default)
    {
        var saved = document with { SavedAt = DateTimeOffset.UtcNow };
        var path = GetPath(saved.Name);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        await using var stream = File.Create(path);
        await JsonSerializer.SerializeAsync(stream, saved, JsonOptions, cancellationToken);

        return saved;
    }

    public IReadOnlyList<string> ListPipelineNames()
    {
        var directory = GetStorageDirectory();
        if (!Directory.Exists(directory))
            return [];

        return Directory.GetFiles(directory, "*.json")
            .Select(Path.GetFileNameWithoutExtension)
            .Where(n => n is not "solution-link")
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Cast<string>()
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private string GetStorageDirectory() =>
        _solutionLink.GetWorkspacePipelineDirectory() ?? _fallbackDirectory;

    private string GetPath(string name)
    {
        var safeName = string.Join("_", name.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
        if (string.IsNullOrWhiteSpace(safeName))
            safeName = "default";

        return Path.Combine(GetStorageDirectory(), $"{safeName}.json");
    }
}
