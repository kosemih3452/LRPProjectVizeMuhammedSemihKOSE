namespace WebApplication1.Models
{
    public class Computer
    {
        public int Id { get; set; }
        public string AssetCode { get; set; }
        public string Brand { get; set; }
        public string Processor { get; set; }
        public int Ram { get; set; }
        public int LabId { get; set; }

        // BURASI ÇOK KRİTİK: Soru işareti (?) olmalı!
        public int? UserId { get; set; }
    }
}
