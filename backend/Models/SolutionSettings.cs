namespace MonadicStudio.Api.Models;

public sealed record SolutionSettings(
    string? ProjectPath,
    string? OutputDirectory,
    string? RootNamespace,
    string OutputFileName = "GeneratedPipeline.cs",
    string? WorkspaceRoot = null);

public sealed record WorkspaceBootstrapRequest(string WorkspaceRoot);

public sealed record SolutionLinkRequest(
    string ProjectPath,
    string? OutputDirectory = null,
    string? RootNamespace = null,
    string? OutputFileName = null);

public sealed record SolutionDiscoverRequest(string DirectoryPath);

public sealed record SolutionDiscoverResponse(
    bool Found,
    string? ProjectPath,
    string? SuggestedOutputDirectory,
    string? SuggestedNamespace,
    string? Message);

public sealed record ExportCodeRequest(
    string CSharpVersion,
    string ParadigmStyle,
    IReadOnlyList<PipelineNode> Nodes);

public sealed record ExportCodeResponse(
    string FilePath,
    string Code,
    IReadOnlyList<string> Diagnostics,
    bool IsValid);
