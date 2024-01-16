namespace Meadowlark.Net.Backend.Postgresql;

public static class Utility
{

  /**
   * Simple only-once guard for a function with no parameters
   */
  public static Action Once(Action fn){
    var called = false;

    void guardedFunction()
    {
      if (!called)
      {
        fn();
        called = true;
      }
    }

    return guardedFunction;
  }
}
