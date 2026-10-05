using Npgsql;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Database")
    ?? throw new InvalidOperationException("A conexão com o banco não foi configurada.");
builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));

var app = builder.Build();

// Rota operacional; os endpoints do contrato serão implementados nas próximas etapas.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.Run();
