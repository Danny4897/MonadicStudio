using System.Text.Json.Serialization;

namespace MonadicStudio.Api.Models;

public sealed record PipelineNode(
    string Id,
    string Type,
    string? MethodName,
    string? InputType,
    string? OutputType,
    string? Prompt,
    [property: JsonPropertyName("positionX")] double? PositionX = null,
    [property: JsonPropertyName("positionY")] double? PositionY = null,
    [property: JsonPropertyName("className")] string? ClassName = null);
