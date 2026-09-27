import { EntryDetail, loadEntry } from "@/components/entries/entry-detail";
import { Modal } from "@/components/ui/modal";

/** Ficha como modal al abrirla desde el catálogo, Mi lista o Favoritos. */
export default async function EntryModal(props: PageProps<"/entry/[id]">) {
  const { id } = await props.params;
  const { entry } = await loadEntry(id);

  return (
    <Modal title={entry.title}>
      <EntryDetail id={id} />
    </Modal>
  );
}
