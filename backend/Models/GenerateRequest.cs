using System.Text.Json.Serialization;

namespace MonadicStudio.Api.Models;

public sealed record GenerateRequest(
    [property: JsonPropertyName("csharpVersion")] string CSharpVersion,
    [property: JsonPropertyName("paradigmStyle")] string ParadigmStyle,
    IReadOnlyList<PipelineNode> Nodes);
