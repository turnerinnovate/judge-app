export function dtwDistance(a: number[], b: number[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(Infinity));
  dp[0][0] = 0;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
