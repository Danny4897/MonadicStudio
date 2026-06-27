namespace MonadicStudio.Api.Models;

public sealed record SolutionMethod(
    string Name,
    string InputType,
    string OutputType,
    bool IsStatic);

public sealed record SolutionClass(
    string Name,
    string Namespace,
    IReadOnlyList<SolutionMethod> Methods);

public sealed record SolutionTreeResponse(
    string? SourcePath,
    bool IsFallback,
    IReadOnlyList<SolutionClass> Classes);
