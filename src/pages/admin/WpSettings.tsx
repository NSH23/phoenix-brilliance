import AdminLayout from '@/components/admin/AdminLayout';
import WpAgentSettingsForm from '@/components/admin/WpAgentSettingsForm';

export default function WpSettings() {
  return (
    <AdminLayout title="WP Agent settings" subtitle="WhatsApp agent module toggles and defaults.">
      <WpAgentSettingsForm />
    </AdminLayout>
  );
}
