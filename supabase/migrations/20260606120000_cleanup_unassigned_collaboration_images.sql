-- Remove orphaned venue gallery images that were never assigned to a folder.
-- Folder-assigned images (folder_id IS NOT NULL) are untouched.
DELETE FROM public.collaboration_images
WHERE folder_id IS NULL;
