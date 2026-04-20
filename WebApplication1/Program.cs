using Microsoft.EntityFrameworkCore;
using WebApplication1.Models; // Modellerine eriþmek için bu þart
var builder = WebApplication.CreateBuilder(args);
// Veritabaný servisini ekliyoruz
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=lrp.db"));

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
