using Contoso.Assets.Data;
using Contoso.Assets.Models;
using Dapper;

namespace Contoso.Assets.Endpoints;

public static class AssetEndpoints
{
    public static void MapAssetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/assets").WithTags("Assets");

        group.MapGet("/", GetAll);
        group.MapGet("/search", Search);
        group.MapGet("/{id:int}", GetById);
        group.MapGet("/by-tag/{tag}", GetByTag);
        group.MapPost("/", Create);
        group.MapPut("/{id:int}", Update);
        group.MapDelete("/{id:int}", Delete);
        group.MapGet("/stats/by-status", StatsByStatus);
    }

    private const string SelectColumns = """
        SELECT id              AS Id,
               asset_tag       AS AssetTag,
               asset_type      AS AssetType,
               manufacturer    AS Manufacturer,
               model           AS Model,
               serial_number   AS SerialNumber,
               purchase_date   AS PurchaseDate,
               warranty_expiry AS WarrantyExpiry,
               status          AS Status,
               notes           AS Notes
        FROM assets
    """;

    private static IResult GetAll(AssetsDb db)
    {
        using var conn = db.Open();
        return Results.Ok(conn.Query<Asset>($"{SelectColumns} ORDER BY asset_tag;"));
    }

    private static IResult Search(AssetsDb db, string? type, string? status, string? q)
    {
        using var conn = db.Open();
        var sql = $"{SelectColumns} WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(type))   { sql += " AND asset_type = @type";   p.Add("type", type); }
        if (!string.IsNullOrWhiteSpace(status)) { sql += " AND status = @status";     p.Add("status", status); }
        if (!string.IsNullOrWhiteSpace(q))      { sql += " AND (asset_tag LIKE @q OR manufacturer LIKE @q OR model LIKE @q)"; p.Add("q", $"%{q}%"); }
        sql += " ORDER BY asset_tag;";
        return Results.Ok(conn.Query<Asset>(sql, p));
    }

    private static IResult GetById(AssetsDb db, int id)
    {
        using var conn = db.Open();
        var item = conn.QueryFirstOrDefault<Asset>($"{SelectColumns} WHERE id = @id;", new { id });
        return item is null ? Results.NotFound() : Results.Ok(item);
    }

    private static IResult GetByTag(AssetsDb db, string tag)
    {
        using var conn = db.Open();
        var item = conn.QueryFirstOrDefault<Asset>($"{SelectColumns} WHERE asset_tag = @tag;", new { tag });
        return item is null ? Results.NotFound() : Results.Ok(item);
    }

    // NOTE: deliberately no input validation here. This is the target of the
    // "Add input validation to the asset create form" course exercise. Empty
    // strings, missing required fields, and nonsensical dates are all accepted.
    private static IResult Create(AssetsDb db, AssetCreate input)
    {
        using var conn = db.Open();
        var id = conn.ExecuteScalar<long>("""
            INSERT INTO assets (asset_tag, asset_type, manufacturer, model, serial_number,
                                purchase_date, warranty_expiry, status, notes)
            VALUES (@AssetTag, @AssetType, @Manufacturer, @Model, @SerialNumber,
                    @PurchaseDate, @WarrantyExpiry, @Status, @Notes);
            SELECT last_insert_rowid();
        """, input);
        return Results.Created($"/assets/{id}", new { id });
    }

    private static IResult Update(AssetsDb db, int id, AssetCreate input)
    {
        using var conn = db.Open();
        var rows = conn.Execute("""
            UPDATE assets SET asset_tag=@AssetTag, asset_type=@AssetType, manufacturer=@Manufacturer,
                              model=@Model, serial_number=@SerialNumber, purchase_date=@PurchaseDate,
                              warranty_expiry=@WarrantyExpiry, status=@Status, notes=@Notes
            WHERE id=@id;
        """, new {
            input.AssetTag, input.AssetType, input.Manufacturer, input.Model,
            input.SerialNumber, input.PurchaseDate, input.WarrantyExpiry,
            input.Status, input.Notes, id
        });
        return rows == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static IResult Delete(AssetsDb db, int id)
    {
        using var conn = db.Open();
        var rows = conn.Execute("DELETE FROM assets WHERE id=@id;", new { id });
        return rows == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static IResult StatsByStatus(AssetsDb db)
    {
        using var conn = db.Open();
        var rows = conn.Query<(string status, int count)>(
            "SELECT status, COUNT(*) AS count FROM assets GROUP BY status;");
        return Results.Ok(rows.ToDictionary(r => r.status, r => r.count));
    }
}
