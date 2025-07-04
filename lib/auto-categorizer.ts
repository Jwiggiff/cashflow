import { Category } from "@prisma/client";
import { prisma } from "./prisma";

export interface CategorizationResult {
  categoryId: number | null;
  confidence: number;
}

// Search existing transactions for similar merchants
async function findSimilarTransaction(
  description: string
): Promise<CategorizationResult | null> {
  const normalizedDescription = description.toLowerCase().trim();

  // First, try exact match
  const exactMatch = await prisma.transaction.findFirst({
    where: {
      description: { equals: description },
      categoryId: {
        not: null,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (exactMatch) {
    return {
      categoryId: exactMatch.categoryId,
      confidence: 0.95, // Very high confidence for exact matches
    };
  }

  // Try partial matches (merchant name contains the search term)
  const partialMatches = await prisma.transaction.findMany({
    where: {
      description: { contains: normalizedDescription },
      categoryId: {
        not: null,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  if (partialMatches.length > 0) {
    // Find the most common category among matches
    const categoryCounts = new Map<number, number>();
    partialMatches.forEach((match: { categoryId: number | null }) => {
      if (match.categoryId) {
        categoryCounts.set(
          match.categoryId,
          (categoryCounts.get(match.categoryId) || 0) + 1
        );
      }
    });

    const mostCommonCategory = Array.from(categoryCounts.entries()).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (mostCommonCategory) {
      return {
        categoryId: mostCommonCategory[0],
        confidence: 0.85, // High confidence for partial matches
      };
    }
  }

  // Try fuzzy matching for similar merchant names
  const allTransactions = await prisma.transaction.findMany({
    where: {
      categoryId: {
        not: null,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Limit to recent transactions for performance
  });

  let bestMatch: { categoryId: number; similarity: number } | null = null;

  for (const transaction of allTransactions) {
    const similarity = calculateSimilarity(
      normalizedDescription,
      transaction.description.toLowerCase()
    );

    if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = {
        categoryId: transaction.categoryId!,
        similarity,
      };
    }
  }

  if (bestMatch) {
    return {
      categoryId: bestMatch.categoryId,
      confidence: bestMatch.similarity,
    };
  }

  return null;
}

// Simple similarity calculation using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// AI-based categorization using OpenAI
export async function autoCategorize(
  description: string,
  categories: Category[]
): Promise<CategorizationResult> {
  // First, try to find similar existing transactions
  const existingMatch = await findSimilarTransaction(description);

  if (existingMatch && existingMatch.confidence > 0.8) {
    return existingMatch;
  }

  // If no good match found, use AI
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    // Return the existing match if we found one, even if confidence is lower
    return (
      existingMatch || {
        categoryId: null,
        confidence: 0,
      }
    );
  }

  try {
    // Create the prompt for OpenAI
    const categoryNames = categories.map((c) => c.name).join(", ");
    const prompt = `Categorize the following transaction description into one of these categories: ${categoryNames}

Transaction: "${description}"

Please respond with only the category name that best matches this transaction. If none of the categories are a good fit, respond with "None".`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'You are a helpful assistant that categorizes financial transactions. Respond with only the category name or "None".',
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const categoryName = data.choices[0]?.message?.content?.trim();

    if (!categoryName || categoryName.toLowerCase() === "none") {
      return (
        existingMatch || {
          categoryId: null,
          confidence: 0,
        }
      );
    }

    // Find the category by name (case-insensitive)
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (category) {
      return {
        categoryId: category.id,
        confidence: 0.9,
      };
    }

    return (
      existingMatch || {
        categoryId: null,
        confidence: 0,
      }
    );
  } catch (error) {
    console.error("AI categorization failed:", error);
    return (
      existingMatch || {
        categoryId: null,
        confidence: 0,
      }
    );
  }
}
