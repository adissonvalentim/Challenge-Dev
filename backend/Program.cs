using MiniCx.Api.Database;
using MiniCx.Api.Contacts;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Database")
    ?? throw new InvalidOperationException("A conexão com o banco não foi configurada.");
builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddScoped<SeedImporter>();
builder.Services.AddScoped<ContactRepository>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var seedPath = builder.Configuration["Seed:Path"] ?? "/data/seed.json";
    await scope.ServiceProvider.GetRequiredService<SeedImporter>().ImportAsync(seedPath);
}

// Rota operacional; os endpoints do contrato serão implementados nas próximas etapas.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapContactEndpoints();
app.Run();
