using Contoso.Assets.Data;
using Contoso.Assets.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var dbPath = Environment.GetEnvironmentVariable("ASSETS_DB_PATH") ?? "/data/assets.db";
builder.Services.AddSingleton(new AssetsDb(dbPath));

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();

// Initialize database (schema + seed)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AssetsDb>();
    db.Initialize();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "assets-svc" }));
app.MapAssetEndpoints();

app.Run();

public partial class Program { }
