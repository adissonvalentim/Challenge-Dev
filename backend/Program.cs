using MiniCx.Api.Database;
using MiniCx.Api.Contacts;
using MiniCx.Api.Analytics;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Database")
    ?? throw new InvalidOperationException("A conexão com o banco não foi configurada.");
builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddScoped<SeedImporter>();
builder.Services.AddScoped<ContactRepository>();
builder.Services.AddScoped<ContactService>();
builder.Services.AddScoped<AnalyticsRepository>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var seedPath = builder.Configuration["Seed:Path"] ?? "/data/seed.json";
    await scope.ServiceProvider.GetRequiredService<SeedImporter>().ImportAsync(seedPath);
}

// Rota operacional disponível após a importação do seed.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapContactEndpoints();
app.MapAnalyticsEndpoints();
app.Run();
