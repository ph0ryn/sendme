export interface PostResult {
  body: string;
  error?: string;
  status: number;
}

export const postJson = async (webhookUrl: string, body: string): Promise<PostResult> => {
  try {
    const response = await fetch(webhookUrl, {
      body,
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    return {
      body: await response.text(),
      status: response.status,
    };
  } catch (error: unknown) {
    let errorMessage = String(error);

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      body: "",
      error: errorMessage,
      status: 0,
    };
  }
};

export const isSuccessStatus = (status: number): boolean => status >= 200 && status < 300;
