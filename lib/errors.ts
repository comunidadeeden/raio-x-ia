export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly expose = false,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.expose ? error.message : "Não foi possível concluir a solicitação." },
      { status: error.status },
    );
  }

  return Response.json(
    { error: "Ocorreu um erro interno. Tente novamente em instantes." },
    { status: 500 },
  );
}
