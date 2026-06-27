namespace MonadicStudio.Api.Models;

public sealed record GenerateResponse(
    string Code,
    IReadOnlyList<string> Diagnostics,
    bool IsValid);
