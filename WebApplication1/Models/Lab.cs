namespace WebApplication1.Models
{
    public class Lab
    {
        public int Id { get; set; }
        public string Name { get; set; }
        // Bir laboratuvarın birden fazla bilgisayarı olabilir
        public List<Computer> Computers { get; set; }
    }
}
