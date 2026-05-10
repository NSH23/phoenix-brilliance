import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Film, Loader2, Plus, Trash2, Upload } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import { getAllCollaborations, getAllEvents, getAllServices } from "@/services";
import {
  getWpMediaAssetsForEntity,
  upsertWpMediaSlotAsset,
  deleteWpMediaSlotAsset,
  clearAllWpMediaSlotsForEntity,
  type WpMediaAsset,
  type WpMediaEntityKind,
} from "@/services/wpMedia";

const IMAGE_SLOT_COUNT = 6;
const VIDEO_SLOT_COUNT = 2;
const GLOBAL_SLOT_KEY = "__global__";

type EntityOption = { id: string; label: string };

export default function WpMediaPage() {
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);

  const [entityKind, setEntityKind] = useState<WpMediaEntityKind>("event");
  const [entityId, setEntityId] = useState<string>("");

  const [eventOptions, setEventOptions] = useState<EntityOption[]>([]);
  const [venueOptions, setVenueOptions] = useState<EntityOption[]>([]);
  const [serviceOptions, setServiceOptions] = useState<EntityOption[]>([]);

  const [assets, setAssets] = useState<WpMediaAsset[]>([]);

  const imageFileRef = useRef<HTMLInputElement | null>(null);

  // Image dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageDialogSlot, setImageDialogSlot] = useState(1);
  const [imageTitle, setImageTitle] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);

  // Video dialog state
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoDialogSlot, setVideoDialogSlot] = useState(1);
  const [videoYoutubeInput, setVideoYoutubeInput] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoSaving, setVideoSaving] = useState(false);

  const [previewAsset, setPreviewAsset] = useState<WpMediaAsset | null>(null);
  const [bulkClearOpen, setBulkClearOpen] = useState(false);
  const [bulkClearing, setBulkClearing] = useState(false);

  const currentEntityOptions = useMemo(() => {
    if (entityKind === "global") return [{ id: GLOBAL_SLOT_KEY, label: "Fallback (All unknown event/venue/service)" }];
    if (entityKind === "event") return eventOptions;
    if (entityKind === "venue") return venueOptions;
    return serviceOptions;
  }, [entityKind, eventOptions, venueOptions, serviceOptions]);

  const resolvedEntityId = useMemo(() => {
    if (entityKind === "global") return null;
    return entityId || null;
  }, [entityKind, entityId]);

  const loadEntities = async () => {
    setEntitiesLoading(true);
    try {
      const [events, collaborations, services] = await Promise.all([getAllEvents(), getAllCollaborations(), getAllServices()]);
      setEventOptions(events.map((e) => ({ id: e.id, label: e.title })));
      setVenueOptions(collaborations.map((c) => ({ id: c.id, label: c.name })));
      setServiceOptions(services.map((s) => ({ id: s.id, label: s.title })));

      // Pick a default entity for the current kind.
      if (!entityId) {
        const opts = entityKind === "event" ? events : entityKind === "venue" ? collaborations : services;
        const first = opts?.[0];
        if (first?.id) setEntityId(String(first.id));
      }
    } catch (err) {
      toast.error("Failed to load entities", { description: (err as Error).message });
    } finally {
      setEntitiesLoading(false);
    }
  };

  const loadAssets = async (nextKind: WpMediaEntityKind, nextEntityId: string | null) => {
    if (nextKind !== "global" && !nextEntityId) {
      setAssets([]);
      return;
    }
    setAssetsLoading(true);
    try {
      const data = await getWpMediaAssetsForEntity(nextKind, nextEntityId);
      setAssets(data);
    } catch (err) {
      toast.error("Failed to load WP media slots", { description: (err as Error).message });
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    void loadEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When kind changes, ensure entityId is valid for that kind.
    if (entityKind === "global") {
      if (entityId !== GLOBAL_SLOT_KEY) setEntityId(GLOBAL_SLOT_KEY);
      return;
    }
    const opts = entityKind === "event" ? eventOptions : entityKind === "venue" ? venueOptions : serviceOptions;
    if (!opts.length) return;
    if (!entityId || !opts.some((o) => o.id === entityId)) {
      setEntityId(opts[0].id);
    }
  }, [entityKind, eventOptions, venueOptions, serviceOptions, entityId]);

  useEffect(() => {
    void loadAssets(entityKind, resolvedEntityId);
  }, [entityKind, resolvedEntityId]);

  const getSlotAsset = (mediaType: "image" | "video", slotIndex: number) => {
    return assets.find((a) => a.media_type === mediaType && a.slot_index === slotIndex) ?? null;
  };

  const onOpenImageSlot = (slotIndex: number) => {
    const current = getSlotAsset("image", slotIndex);
    setImageDialogSlot(slotIndex);
    setImageTitle(current?.title ?? "");
    setImageDescription(current?.description ?? "");
    setImageProgress(0);
    if (imageFileRef.current) imageFileRef.current.value = "";
    setImageDialogOpen(true);
  };

  const onOpenVideoSlot = (slotIndex: number) => {
    const current = getSlotAsset("video", slotIndex);
    setVideoDialogSlot(slotIndex);
    setVideoTitle(current?.title ?? "");
    setVideoDescription(current?.description ?? "");
    setVideoYoutubeInput(current?.youtube_id ?? "");
    setVideoSaving(false);
    setVideoDialogOpen(true);
  };

  const onBulkClear = async () => {
    if (entityKind !== "global" && !resolvedEntityId) {
      toast.error("Select an Event/Venue/Service first");
      return;
    }
    setBulkClearing(true);
    try {
      await clearAllWpMediaSlotsForEntity(entityKind, resolvedEntityId);
      await loadAssets(entityKind, resolvedEntityId);
      toast.success("All slots cleared for this item");
      setBulkClearOpen(false);
    } catch (err) {
      toast.error("Failed to clear slots", { description: (err as Error).message });
    } finally {
      setBulkClearing(false);
    }
  };

  const onDeleteSlot = async (mediaType: "image" | "video", slotIndex: number) => {
    if (!confirm(`Delete this ${mediaType} slot (#${slotIndex})?`)) return;
    try {
      await deleteWpMediaSlotAsset({ entity_kind: entityKind, entity_id: resolvedEntityId, media_type: mediaType, slot_index: slotIndex });
      await loadAssets(entityKind, resolvedEntityId);
      toast.success("Slot cleared");
    } catch (err) {
      toast.error("Failed to clear slot", { description: (err as Error).message });
    }
  };

  const onSaveImageSlot = async () => {
    if (entityKind !== "global" && !resolvedEntityId) {
      toast.error("Select an Event/Venue/Service first");
      return;
    }
    const file = imageFileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please choose an image file");
      return;
    }

    setImageUploading(true);
    setImageProgress(0);
    try {
      const url = await uploadToCloudinary(file, "wp-agent-media", setImageProgress);
      await upsertWpMediaSlotAsset({
        entity_kind: entityKind,
        entity_id: resolvedEntityId,
        media_type: "image",
        slot_index: imageDialogSlot,
        title: imageTitle.trim() ? imageTitle.trim() : null,
        description: imageDescription.trim() ? imageDescription.trim() : null,
        cloudinary_url: url,
      });
      toast.success(`Image saved to slot #${imageDialogSlot}`);
      setImageDialogOpen(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
      await loadAssets(entityKind, resolvedEntityId);
    } catch (err) {
      toast.error("Failed to save image", { description: (err as Error).message });
    } finally {
      setImageUploading(false);
      setImageProgress(0);
    }
  };

  const youtubePreview = useMemo(() => getYouTubeId(videoYoutubeInput || ""), [videoYoutubeInput]);

  const onSaveVideoSlot = async () => {
    if (entityKind !== "global" && !resolvedEntityId) {
      toast.error("Select an Event/Venue/Service first");
      return;
    }
    const id = getYouTubeId(videoYoutubeInput || "");
    if (!id) {
      toast.error("Please enter a valid YouTube URL or video ID");
      return;
    }

    setVideoSaving(true);
    try {
      await upsertWpMediaSlotAsset({
        entity_kind: entityKind,
        entity_id: resolvedEntityId,
        media_type: "video",
        slot_index: videoDialogSlot,
        title: videoTitle.trim() ? videoTitle.trim() : null,
        description: videoDescription.trim() ? videoDescription.trim() : null,
        youtube_id: id,
      });
      toast.success(`Video saved to slot #${videoDialogSlot}`);
      setVideoDialogOpen(false);
      await loadAssets(entityKind, resolvedEntityId);
    } catch (err) {
      toast.error("Failed to save video", { description: (err as Error).message });
    } finally {
      setVideoSaving(false);
    }
  };

  const imageSlots = useMemo(() => Array.from({ length: IMAGE_SLOT_COUNT }, (_, i) => i + 1), []);
  const videoSlots = useMemo(() => Array.from({ length: VIDEO_SLOT_COUNT }, (_, i) => i + 1), []);

  return (
    <AdminLayout title="WP Agent Media Slots" subtitle="Upload 6 images + 2 YouTube videos per Event/Venue/Service, with fallback slots for unknown user requests">
      <div className="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6">
        <Select value={entityKind} onValueChange={(v) => setEntityKind(v as WpMediaEntityKind)}>
          <SelectTrigger className="w-full sm:w-[220px] h-11 sm:h-10">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event">All events</SelectItem>
            <SelectItem value="venue">All venues</SelectItem>
            <SelectItem value="service">All services</SelectItem>
            <SelectItem value="global">Fallback media</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityId} onValueChange={setEntityId} disabled={entitiesLoading || currentEntityOptions.length === 0}>
          <SelectTrigger className="w-full sm:flex-1 h-11 sm:h-10">
            <SelectValue placeholder={entitiesLoading ? "Loading..." : "Select item"} />
          </SelectTrigger>
          <SelectContent>
            {currentEntityOptions.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="h-11 sm:h-10 sm:px-5" variant="outline" onClick={() => void loadAssets(entityKind, resolvedEntityId)} disabled={assetsLoading || (entityKind !== "global" && !resolvedEntityId)}>
          {assetsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Reload slots
        </Button>
        <Button
          type="button"
          className="h-11 sm:h-10 sm:px-5"
          variant="destructive"
          disabled={assetsLoading || bulkClearing || (entityKind !== "global" && !resolvedEntityId)}
          onClick={() => setBulkClearOpen(true)}
        >
          {bulkClearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Clear all slots
        </Button>
      </div>

      <Card className="rounded-2xl sm:rounded-lg border border-border/60 sm:border-border">
        <CardContent className="p-4 sm:p-5">
          {assetsLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : entityKind !== "global" && !resolvedEntityId ? (
            <div className="py-10 text-center text-muted-foreground">No entity selected.</div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Images (slots 1 to {IMAGE_SLOT_COUNT})</h3>
                    <p className="text-sm text-muted-foreground">Upload/replace 1 image per slot (Cloudinary).</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageSlots.map((slotIndex) => {
                    const slotAsset = getSlotAsset("image", slotIndex);
                    return (
                      <div key={slotIndex} className="border border-border/60 rounded-xl p-3">
                        <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                          {slotAsset?.cloudinary_url ? (
                            <img
                              src={slotAsset.cloudinary_url}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground px-2 text-center">
                              Empty
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">#{slotIndex}</p>
                          <div className="flex gap-1">
                            {slotAsset?.cloudinary_url ? (
                              <Button type="button" size="sm" className="h-9 px-2" variant="outline" onClick={() => setPreviewAsset(slotAsset)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            ) : null}
                            <Button type="button" size="sm" className="h-9" variant={slotAsset ? "outline" : "secondary"} onClick={() => onOpenImageSlot(slotIndex)}>
                              <Upload className="w-3.5 h-3.5 mr-1" /> {slotAsset ? "Replace" : "Upload"}
                            </Button>
                          </div>
                        </div>
                        {slotAsset?.updated_at ? (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Last updated {new Date(slotAsset.updated_at).toLocaleString()}
                          </p>
                        ) : null}

                        {slotAsset ? (
                          <Button type="button" size="sm" variant="destructive" className="h-9 w-full mt-2" onClick={() => void onDeleteSlot("image", slotIndex)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Videos (slots 1 to {VIDEO_SLOT_COUNT})</h3>
                    <p className="text-sm text-muted-foreground">Upload/replace 1 YouTube video per slot (store only YouTube link).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {videoSlots.map((slotIndex) => {
                    const slotAsset = getSlotAsset("video", slotIndex);
                    const thumb = slotAsset?.youtube_id ? getYouTubeThumbnail(slotAsset.youtube_id) : "";
                    return (
                      <div key={slotIndex} className="border border-border/60 rounded-xl p-3">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="text-xs text-muted-foreground px-2 text-center">Empty</div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">#{slotIndex}</p>
                          <div className="flex gap-1">
                            {slotAsset?.youtube_id ? (
                              <Button type="button" size="sm" className="h-9 px-2" variant="outline" onClick={() => setPreviewAsset(slotAsset)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            ) : null}
                            <Button type="button" size="sm" className="h-9" variant={slotAsset ? "outline" : "secondary"} onClick={() => onOpenVideoSlot(slotIndex)}>
                              <Film className="w-3.5 h-3.5 mr-1" /> {slotAsset ? "Replace" : "Upload"}
                            </Button>
                          </div>
                        </div>
                        {slotAsset?.updated_at ? (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Last updated {new Date(slotAsset.updated_at).toLocaleString()}
                          </p>
                        ) : null}

                        {slotAsset ? (
                          <Button type="button" size="sm" variant="destructive" className="h-9 w-full mt-2" onClick={() => void onDeleteSlot("video", slotIndex)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-md:w-[95vw]">
          <DialogHeader>
            <DialogTitle>Set Image Slot #{imageDialogSlot}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Title (optional)</Label>
              <Input className="h-11" value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} placeholder="Optional title" />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Textarea value={imageDescription} onChange={(e) => setImageDescription(e.target.value)} placeholder="Optional description" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Image file (Cloudinary)</Label>
              <Input ref={imageFileRef} type="file" accept="image/*" className="h-11" />
              {imageUploading ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Upload className="w-3 h-3" /> Uploading... {imageProgress}%
                  </p>
                  <Progress value={imageProgress} className="h-2" />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => setImageDialogOpen(false)} disabled={imageUploading}>
                Cancel
              </Button>
              <Button type="button" className="h-11 sm:h-10" onClick={() => void onSaveImageSlot()} disabled={imageUploading}>
                {imageUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewAsset} onOpenChange={(o) => !o && setPreviewAsset(null)}>
        <DialogContent className="max-w-3xl max-md:w-[95vw] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-border/60">
            <DialogTitle className="text-base truncate pr-8">{previewAsset?.title || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted/30">
            {previewAsset?.media_type === "image" && previewAsset.cloudinary_url ? (
              <img src={previewAsset.cloudinary_url} alt="" className="w-full max-h-[70vh] object-contain rounded-lg mx-auto" />
            ) : previewAsset?.media_type === "video" && previewAsset.youtube_id ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-border/60 bg-black">
                <iframe
                  title="YouTube preview"
                  src={`https://www.youtube.com/embed/${previewAsset.youtube_id}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nothing to preview.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkClearOpen} onOpenChange={setBulkClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear every slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all images and YouTube slots for the selected{" "}
              {entityKind === "global" ? "fallback media" : entityKind}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onBulkClear()} disabled={bulkClearing}>
              {bulkClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clear all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-md:w-[95vw]">
          <DialogHeader>
            <DialogTitle>Set Video Slot #{videoDialogSlot}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>YouTube URL or Video ID</Label>
              <Input className="h-11" value={videoYoutubeInput} onChange={(e) => setVideoYoutubeInput(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              <p className="text-xs text-muted-foreground">
                Video upload to YouTube is not automated here. Paste a YouTube link or the 11-char video ID.
              </p>
              {youtubePreview ? (
                <img src={getYouTubeThumbnail(youtubePreview)} alt="" className="w-full aspect-video rounded-lg object-cover border border-border/50" loading="lazy" decoding="async" />
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Title (optional)</Label>
              <Input className="h-11" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Optional title" />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Textarea value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} placeholder="Optional description" rows={3} />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => setVideoDialogOpen(false)} disabled={videoSaving}>
                Cancel
              </Button>
              <Button type="button" className="h-11 sm:h-10" onClick={() => void onSaveVideoSlot()} disabled={videoSaving}>
                {videoSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
