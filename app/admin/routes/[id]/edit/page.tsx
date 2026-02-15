"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateRoute } from "@/app/actions/routes";
import { uploadRouteImage } from "@/app/actions/uploads";
import { createClient } from "@/lib/supabase/client";
import type { RouteDifficulty } from "@/lib/types";

export default function EditRoutePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Medium" as RouteDifficulty,
    duration: "",
    price: 0,
    cover_image_url: "",
    komoot_iframe: "",
    is_active: true,
    discount_type: "none" as "none" | "fixed" | "percentage",
    discount_value: 0,
    discount_from_pax: 2,
    distance_mi: null as number | null,
    avg_speed_mph: null as number | null,
    uphill_ft: null as number | null,
    downhill_ft: null as number | null,
  });

  useEffect(() => {
    async function fetchRoute() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("routes")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error || !data) {
          setFormError("Route not found.");
          setFetching(false);
          return;
        }

        setFormData({
          title: data.title || "",
          description: data.description || "",
          difficulty: data.difficulty || "Medium",
          duration: data.duration || "",
          price: data.price || 0,
          cover_image_url: data.cover_image_url || "",
          komoot_iframe: data.komoot_iframe || "",
          is_active: data.is_active ?? true,
          discount_type: data.discount_type || "none",
          discount_value: data.discount_value || 0,
          discount_from_pax: data.discount_from_pax || 2,
          distance_mi: data.distance_mi ?? null,
          avg_speed_mph: data.avg_speed_mph ?? null,
          uphill_ft: data.uphill_ft ?? null,
          downhill_ft: data.downhill_ft ?? null,
        });
      } catch {
        setFormError("Failed to load route data.");
      } finally {
        setFetching(false);
      }
    }

    fetchRoute();
  }, [params.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be less than 5MB.");
      return;
    }

    setUploading(true);
    setFormError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const result = await uploadRouteImage(formDataUpload);
      if (result.error) {
        setFormError(`Image upload failed: ${result.error}`);
      } else if (result.url) {
        setFormData((prev) => ({ ...prev, cover_image_url: result.url! }));
        toast({ title: "Uploaded", description: "Image uploaded successfully" });
      }
    } catch (err: any) {
      setFormError(`Image upload failed: ${err.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Route title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!formData.duration.trim()) {
      setFormError("Duration is required.");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setFormError("Price must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const result = await updateRoute(params.id as string, {
        ...formData,
        cover_image_url: formData.cover_image_url || null,
        komoot_iframe: formData.komoot_iframe || null,
      });

      if (result.error) {
        setFormError(result.error);
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Route updated successfully!" });
        router.push("/admin/routes");
      }
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred. Please try again.";
      setFormError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/routes"
        className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Routes
      </Link>

      <h1 className="text-3xl font-bold mb-8">Edit Route</h1>

      {formError && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Something went wrong</p>
            <p className="text-sm text-red-600 mt-1">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Route Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Doi Suthep Sunrise Ride"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the route, highlights, and experience..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: RouteDifficulty) =>
                      setFormData({ ...formData, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 3-4 hours"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price per Person (THB) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  placeholder="e.g., 1500"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Group Discount */}
          <Card>
            <CardHeader>
              <CardTitle>Group Discount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: "none" | "fixed" | "percentage") =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Discount</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (THB off per extra person)</SelectItem>
                    <SelectItem value="percentage">Percentage (% off per extra person)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  Discount applies to each person from the Nth rider onwards
                </p>
              </div>

              {formData.discount_type !== "none" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount_value">
                        {formData.discount_type === "fixed" ? "Discount Amount (THB)" : "Discount Percentage (%)"}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        min="0"
                        max={formData.discount_type === "percentage" ? 100 : undefined}
                        placeholder={formData.discount_type === "fixed" ? "e.g., 200" : "e.g., 10"}
                        value={formData.discount_value || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount_from_pax">Starting from Rider #</Label>
                      <Input
                        id="discount_from_pax"
                        type="number"
                        min="2"
                        placeholder="e.g., 2"
                        value={formData.discount_from_pax}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_from_pax: parseInt(e.target.value) || 2 })
                        }
                      />
                    </div>
                  </div>

                  {formData.price > 0 && formData.discount_value > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                      <p className="font-medium text-green-800">Preview:</p>
                      <p className="text-green-700">
                        Rider 1{formData.discount_from_pax > 2 ? ` to ${formData.discount_from_pax - 1}` : ""}: {formData.price.toLocaleString()} THB each
                      </p>
                      <p className="text-green-700">
                        Rider {formData.discount_from_pax}+:{" "}
                        {formData.discount_type === "fixed"
                          ? `${(formData.price - formData.discount_value).toLocaleString()} THB each (${formData.discount_value.toLocaleString()} THB off)`
                          : `${(formData.price * (1 - formData.discount_value / 100)).toLocaleString()} THB each (${formData.discount_value}% off)`
                        }
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Route Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Route Stats (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Enter ride statistics in imperial units. Metric conversions are shown automatically to visitors.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance_mi">Distance (mi)</Label>
                  <Input
                    id="distance_mi"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 9.62"
                    value={formData.distance_mi ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, distance_mi: e.target.value ? parseFloat(e.target.value) : null })
                    }
                  />
                  {formData.distance_mi && (
                    <p className="text-xs text-gray-400">= {(formData.distance_mi * 1.60934).toFixed(1)} km</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avg_speed_mph">Avg Speed (mph)</Label>
                  <Input
                    id="avg_speed_mph"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g., 12.0"
                    value={formData.avg_speed_mph ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, avg_speed_mph: e.target.value ? parseFloat(e.target.value) : null })
                    }
                  />
                  {formData.avg_speed_mph && (
                    <p className="text-xs text-gray-400">= {(formData.avg_speed_mph * 1.60934).toFixed(1)} km/h</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uphill_ft">Uphill (ft)</Label>
                  <Input
                    id="uphill_ft"
                    type="number"
                    min="0"
                    placeholder="e.g., 200"
                    value={formData.uphill_ft ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, uphill_ft: e.target.value ? parseInt(e.target.value) : null })
                    }
                  />
                  {formData.uphill_ft && (
                    <p className="text-xs text-gray-400">= {Math.round(formData.uphill_ft * 0.3048)} m</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="downhill_ft">Downhill (ft)</Label>
                  <Input
                    id="downhill_ft"
                    type="number"
                    min="0"
                    placeholder="e.g., 4225"
                    value={formData.downhill_ft ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, downhill_ft: e.target.value ? parseInt(e.target.value) : null })
                    }
                  />
                  {formData.downhill_ft && (
                    <p className="text-xs text-gray-400">= {Math.round(formData.downhill_ft * 0.3048)} m</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media & Extras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {formData.cover_image_url ? (
                    <div className="relative aspect-video rounded overflow-hidden">
                      <img
                        src={formData.cover_image_url}
                        alt="Cover"
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => setFormData({ ...formData, cover_image_url: "" })}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2">Click to upload image</p>
                          <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">Max 5MB</p>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="komoot_iframe">Komoot Embed Code</Label>
                <Textarea
                  id="komoot_iframe"
                  placeholder='<iframe src="https://www.komoot.com/..." ...></iframe>'
                  rows={3}
                  value={formData.komoot_iframe}
                  onChange={(e) => setFormData({ ...formData, komoot_iframe: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  Paste the iframe embed code from Komoot
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked as boolean })
                  }
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium leading-none"
                >
                  Route is active and visible to customers
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex gap-4">
          <Button type="submit" size="lg" disabled={loading || uploading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Link href="/admin/routes">
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
