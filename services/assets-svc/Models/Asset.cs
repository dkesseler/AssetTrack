namespace Contoso.Assets.Models;

// Dates are stored as ISO TEXT in SQLite and exchanged as strings everywhere.
// Class with init setters so Dapper can use the parameterless ctor.
public class Asset
{
    public long Id { get; set; }
    public string AssetTag { get; set; } = "";
    public string AssetType { get; set; } = "";
    public string Manufacturer { get; set; } = "";
    public string Model { get; set; } = "";
    public string? SerialNumber { get; set; }
    public string? PurchaseDate { get; set; }
    public string? WarrantyExpiry { get; set; }
    public string Status { get; set; } = "";
    public string? Notes { get; set; }
}

public class AssetCreate
{
    public string? AssetTag { get; set; }
    public string? AssetType { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? PurchaseDate { get; set; }
    public string? WarrantyExpiry { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}
