/**
 * Reduces the dimension of a vector to the target dimension
 */
export function reduceDimensions(
	vector: number[],
	targetDimension: number = 2048
): number[] {
	if (!vector) return [];
	return vector.slice(0, targetDimension);
}
