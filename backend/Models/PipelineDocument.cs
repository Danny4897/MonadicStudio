using System.Text.Json.Serialization;

namespace MonadicStudio.Api.Models;

public sealed record PipelineEdge(
    string Id,
    string Source,
    string Target);

public sealed record PipelineDocument(
    string Name,
    [property: JsonPropertyName("csharpVersion")] string CSharpVersion,
    [property: JsonPropertyName("paradigmStyle")] string ParadigmStyle,
    IReadOnlyList<PipelineNode> Nodes,
    IReadOnlyList<PipelineEdge> Edges,
    DateTimeOffset SavedAt);
