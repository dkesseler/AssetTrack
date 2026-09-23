using Xunit;

namespace Contoso.Assets.Tests;

// Intentionally minimal. Filling out coverage for the asset endpoints
// (happy paths + edge cases for search, create, update, delete) is one of
// the course exercises.
public class SmokeTests
{
    [Fact]
    public void True_is_true()
    {
        Assert.True(true);
    }
}
