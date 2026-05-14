using Microsoft.EntityFrameworkCore;
using WebApplication1.Models; // Modellerine eriþmek için bu þart
var builder = WebApplication.CreateBuilder(args);
// Veritabaný servisini ekliyoruz
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=lrp.db"));

// Add services to the container.


// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();

// JSON Sonsuz Döngü Hatasýný Çözen Kod
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (!db.Users.Any())
    {
        db.Users.Add(new User
        {
            Username = "admin",
            Password = "admin123",
            Role = "Admin",
            FullName = "Sistem Yöneticisi",
            // BU SATIRI EKLEDÝK:
            StudentNo = "ADMIN"
        });
        db.SaveChanges();
    }
}
app.UseDefaultFiles(); // Tarayýcýnýn otomatik olarak index.html'i bulmasýný saðlar.
app.UseStaticFiles();  // wwwroot klasöründeki HTML, CSS ve JS dosyalarýný eriþime açar.
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

// --- LABORATUVAR ÝÞLEMLERÝ ---
// BÝLGÝSAYARLARI LÝSTELEME
// LABORATUVARLARI LÝSTELEME (Garantili Yöntem)
app.MapGet("/api/labs", async (AppDbContext db) => {
    // Sadece Id ve Name alanlarýný çekerek sonsuz döngüyü engelliyoruz
    var labs = await db.Labs.Select(l => new { id = l.Id, name = l.Name }).ToListAsync();
    return Results.Ok(labs);
}); app.MapPost("/api/labs", async (AppDbContext db, Lab lab) => {
    db.Labs.Add(lab);
    await db.SaveChangesAsync();
    return Results.Created($"/api/labs/{lab.Id}", lab);
});

// --- BÝLGÝSAYAR ÝÞLEMLERÝ (AssetCode Otomasyonlu) ---
app.MapPost("/api/computers", async (AppDbContext db, Computer pc) => {
    // Ayný laboratuvardaki PC sayýsýný bulup kod üretme
    var count = await db.Computers.CountAsync(c => c.LabId == pc.LabId) + 1;
    pc.AssetCode = $"LAB{pc.LabId}-PC-{count:D2}";

    db.Computers.Add(pc);
    await db.SaveChangesAsync();
    return Results.Ok(pc);
});

// --- KÝMLÝK DOÐRULAMA (Login) ---
app.MapPost("/api/login", async (AppDbContext db, User loginData) => {
    var user = await db.Users.FirstOrDefaultAsync(u =>
        u.Username == loginData.Username && u.Password == loginData.Password);

    if (user == null) return Results.Unauthorized();

    // Rolüne göre veri dönüyoruz (Frontend burada yönlendirme yapacak)
    return Results.Ok(new { user.Username, user.Role, user.FullName, user.Id });
});

// --- SORUMLULUK ATAMA VE OTOMATÝK HESAP ---
app.MapPost("/api/assign", async (AppDbContext db, int pcId, string studentNo, string fullName) => {
    var pc = await db.Computers.FindAsync(pcId);
    if (pc == null) return Results.NotFound();

    // Öðrenci yoksa oluþtur
    var user = await db.Users.FirstOrDefaultAsync(u => u.StudentNo == studentNo);
    if (user == null)
    {
        user = new User
        {
            Username = studentNo,
            Password = "123", // Varsayýlan þifre
            Role = "Student",
            FullName = fullName,
            StudentNo = studentNo
        };
        db.Users.Add(user);
    }

    pc.UserId = user.Id;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Atama baþarýlý", student = user.Username });
});
// BÝLGÝSAYARLARI LÝSTELEME (Garantili Yöntem - Sonsuz Döngüyü Engeller)
app.MapGet("/api/computers", async (AppDbContext db) => {
    var pcs = await db.Computers.Select(c => new {
        id = c.Id,
        assetCode = c.AssetCode,
        brand = c.Brand,
        processor = c.Processor,
        ram = c.Ram,
        userId = c.UserId
    }).ToListAsync();

    return Results.Ok(pcs);
});
// ÖÐRENCÝNÝN KENDÝ BÝLGÝSAYARINI GETÝRME
app.MapGet("/api/my-computer/{userId}", async (AppDbContext db, int userId) => {
    var pc = await db.Computers.FirstOrDefaultAsync(c => c.UserId == userId);
    return pc is not null ? Results.Ok(pc) : Results.NotFound("Zimmetli cihaz bulunamadý.");
});
// LABORATUVAR SÝLME UCU
app.MapDelete("/api/labs/{id}", async (AppDbContext db, int id) => {
    var lab = await db.Labs.FindAsync(id);
    if (lab == null) return Results.NotFound();

    db.Labs.Remove(lab);
    await db.SaveChangesAsync();
    return Results.Ok();
});

// Laboratuvar Güncelleme
app.MapPut("/api/labs/{id}", async (AppDbContext db, int id, Lab updatedLab) => {
    var lab = await db.Labs.FindAsync(id);
    if (lab == null) return Results.NotFound();
    lab.Name = updatedLab.Name;
    await db.SaveChangesAsync();
    return Results.NoContent();
});
app.Run();
