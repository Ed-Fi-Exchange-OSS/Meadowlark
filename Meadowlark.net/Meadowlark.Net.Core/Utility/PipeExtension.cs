namespace Meadowlark.Net.Core.Utility;

// Implements functional pipe forwarding - functions are the same
public static class PipeExtension {
  public static TOutput AndThen<TInput, TOutput>(this TInput input, in Func<TInput, TOutput> map)
    where TInput : class
    where TOutput : class =>
      map(input);

  public static TOutput SendTo<TInput, TOutput>(this TInput input, in Func<TInput, TOutput> map)
    where TInput : class
    where TOutput : class =>
      map(input);
}
