import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Crown, Plus, Pencil, Trash2, Check } from "lucide-react";

interface PremiumPlan {
  id: string;
  plan_name: string;
  price: number;
  billing_duration: string;
  benefits: string[];
  description: string | null;
  cta_text: string | null;
  is_active: boolean;
  sort_order: number;
}

const PremiumPlanManager = () => {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<PremiumPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("one-time");
  const [formBenefits, setFormBenefits] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCta, setFormCta] = useState("");
  const [formActive, setFormActive] = useState(true);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("premium_plans")
      .select("*")
      .order("sort_order");
    setPlans((data as any) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditPlan(null);
    setFormName(""); setFormPrice("199"); setFormDuration("one-time");
    setFormBenefits(""); setFormDescription(""); setFormCta("Go Premium"); setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (plan: PremiumPlan) => {
    setEditPlan(plan);
    setFormName(plan.plan_name);
    setFormPrice(String(plan.price));
    setFormDuration(plan.billing_duration);
    setFormBenefits(plan.benefits.join("\n"));
    setFormDescription(plan.description || "");
    setFormCta(plan.cta_text || "");
    setFormActive(plan.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const benefits = formBenefits.split("\n").map(b => b.trim()).filter(Boolean);
    const payload = {
      plan_name: formName,
      price: Number(formPrice),
      billing_duration: formDuration,
      benefits,
      description: formDescription || null,
      cta_text: formCta || null,
      is_active: formActive,
    };

    if (editPlan) {
      const { error } = await supabase
        .from("premium_plans")
        .update(payload as any)
        .eq("id", editPlan.id);
      if (error) { toast.error("Failed to update plan"); return; }
      toast.success("Plan updated!");
    } else {
      const { error } = await supabase
        .from("premium_plans")
        .insert(payload as any);
      if (error) { toast.error("Failed to create plan"); return; }
      toast.success("Plan created!");
    }
    setDialogOpen(false);
    fetchPlans();
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from("premium_plans").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Plan deleted");
    fetchPlans();
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Premium Plan Management
        </CardTitle>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="w-4 h-4" /> Add Plan
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {plans.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No premium plans yet</p>
        )}
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex items-start justify-between p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{plan.plan_name}</h4>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-primary">₹{plan.price} <span className="text-sm font-normal text-muted-foreground">{plan.billing_duration}</span></p>
              {plan.description && <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>}
              <div className="flex flex-wrap gap-1 mt-2">
                {plan.benefits.map((b, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-muted rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-500" /> {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePlan(plan.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Billing Duration</Label>
                  <Input value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="e.g. one-time, monthly" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="mt-1" />
              </div>
              <div>
                <Label>Benefits (one per line)</Label>
                <Textarea value={formBenefits} onChange={(e) => setFormBenefits(e.target.value)} rows={5} className="mt-1" placeholder="View premium notes&#10;Publish paid content&#10;..." />
              </div>
              <div>
                <Label>CTA Button Text</Label>
                <Input value={formCta} onChange={(e) => setFormCta(e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editPlan ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PremiumPlanManager;
