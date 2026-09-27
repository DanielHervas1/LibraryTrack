/** Enlace inexistente, desactivado o sustituido por uno nuevo. */
export default function SharedNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-20 text-center">
      <h1 className="text-lg font-semibold">Este enlace no está disponible</h1>
      <p className="max-w-sm text-sm text-muted">
        Puede que se haya desactivado o que lo hayan cambiado por uno nuevo. Pide a quien te lo pasó
        el enlace actual.
      </p>
    </main>
  );
}
