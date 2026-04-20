namespace WebApplication1.Models
{
    public class Computer
    {
        public int Id { get; set; }
        public string AssetCode { get; set; } // LAB1-PC-01 gibi
        public string Brand { get; set; }
        public string Processor { get; set; }
        public string RAM { get; set; }

        public int LabId { get; set; } // Hangi laboratuvarda?
        public int? UserId { get; set; } // Hangi öğrenciye zimmetli? (Boş olabilir)
    }
}
