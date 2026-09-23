using Contoso.Assets.Data;
using Dapper;
using Xunit;

namespace Contoso.Assets.Tests;

// Regression test for the missing-AssetsDb gap: verifies that
// AssetsDb.Initialize() creates the assets schema and applies seed data
// against a real SQLite file. Caught the issue that the polyglot rebuild
// commit had not tracked Data/AssetsDb.cs or Data/SeedData.cs.
public class AssetsDbTests
{
    [Fact]
    public void Initialize_creates_assets_table_and_seed_data()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"assets-{Guid.NewGuid():N}.db");
        var db = new AssetsDb(dbPath);

        try
        {
            db.Initialize();

            using var conn = db.Open();
            var count = conn.ExecuteScalar<int>("SELECT COUNT(*) FROM assets;");
            var assignedCount = conn.ExecuteScalar<int>(
                "SELECT COUNT(*) FROM assets WHERE status = 'assigned';");

            Assert.True(count > 0);
            Assert.True(assignedCount > 0);
        }
        finally
        {
            if (File.Exists(dbPath))
            {
                File.Delete(dbPath);
            }
        }
    }
}
