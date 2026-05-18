import Fotos from './Fotos';
import Notas from './Notas';

export default function DocumentosTab() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <Fotos />
      <Notas />
    </div>
  );
}
