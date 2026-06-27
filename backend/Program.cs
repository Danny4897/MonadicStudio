using MonadicStudio.Api.Models;
using MonadicStudio.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<RoslynCodeFormatterService>();
builder.Services.AddSingleton<SolutionLinkService>();
builder.Services.AddSingleton<CodeGeneratorService>();
builder.Services.AddSingleton<SolutionExplorerService>();
builder.Services.AddSingleton<PipelinePersistenceService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();

app.MapPost("/api/generate", (GenerateRequest request, CodeGeneratorService generator) =>
    Results.Ok(generator.Generate(request)));

app.MapPost("/api/generate/export", (ExportCodeRequest request, CodeGeneratorService generator, SolutionLinkService link) =>
{
    try
    {
        var generateRequest = new GenerateRequest(request.CSharpVersion, request.ParadigmStyle, request.Nodes);
        var generated = generator.Generate(generateRequest);
        var filePath = link.ExportCode(generated.Code);
        return Results.Ok(new ExportCodeResponse(filePath, generated.Code, generated.Diagnostics, generated.IsValid));
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/solution/config", (SolutionLinkService link) =>
    Results.Ok(link.GetSettings()));

app.MapPost("/api/solution/bootstrap", (WorkspaceBootstrapRequest request, SolutionLinkService link) =>
{
    try
    {
        return Results.Ok(link.BootstrapWorkspace(request.WorkspaceRoot));
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/solution/link", (SolutionLinkRequest request, SolutionLinkService link) =>
{
    try
    {
        return Results.Ok(link.Link(request));
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapPost("/api/solution/discover", (SolutionDiscoverRequest request, SolutionLinkService link) =>
    Results.Ok(link.Discover(request.DirectoryPath)));

app.MapGet("/api/solution/tree", (SolutionExplorerService explorer) =>
    Results.Ok(explorer.GetTree()));

app.MapGet("/api/pipeline/{name?}", async (string? name, PipelinePersistenceService persistence) =>
{
    var document = await persistence.LoadAsync(name ?? "default");
    return document is null ? Results.NotFound() : Results.Ok(document);
});

app.MapPost("/api/pipeline", async (PipelineDocument document, PipelinePersistenceService persistence) =>
{
    var saved = await persistence.SaveAsync(document);
    return Results.Ok(saved);
});

app.MapGet("/api/pipeline", (PipelinePersistenceService persistence) =>
    Results.Ok(persistence.ListPipelineNames()));

app.Run();
