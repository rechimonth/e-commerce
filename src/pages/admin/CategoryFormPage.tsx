import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

export function CategoryFormPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Categorías</h1>
      <Card className="space-y-4 p-6">
        <p className="text-neutral-700">
          Las categorías son una taxonomía fija (action-figures, video-games y shoes)
          validada por las reglas de Firestore. No se pueden crear ni renombrar desde
          el panel porque eso produciría categorías que el catálogo y las reglas rechazan.
        </p>
        <Link to={ROUTES.ADMIN_CATEGORIES}>
          <Button variant="solid">Volver a categorías</Button>
        </Link>
      </Card>
    </div>
  );
}

export default CategoryFormPage;
