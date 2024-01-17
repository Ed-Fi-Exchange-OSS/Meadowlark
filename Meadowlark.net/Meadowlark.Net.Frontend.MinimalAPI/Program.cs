using static Meadowlark.Net.Frontend.MinimalAPI.CrudHandler;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapPost("/{**catchAll}", Upsert);
app.MapGet("/{**catchAll}", GetById);
app.MapPut("/", Update);
app.MapDelete("/", DeleteIt);

app.Run("http://localhost:3000");
