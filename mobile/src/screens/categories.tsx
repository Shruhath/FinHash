import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Check, Pencil, Plus, Shapes, Trash2 } from "lucide-react-native";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import Screen from "@/components/ui/Screen";
import AppHeader from "@/components/layout/AppHeader";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Badge from "@/components/ui/Badge";
import Field from "@/components/ui/Field";
import Sheet from "@/components/ui/Sheet";
import TextField from "@/components/ui/TextField";
import SegmentedControl from "@/components/ui/SegmentedControl";
import CategoryIcon from "@/components/ui/CategoryIcon";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PressableScale from "@/components/ui/PressableScale";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { COLOR_CHOICES, ICON_CHOICES } from "@/lib/categoryIcons";
import { haptic } from "@/lib/haptics";
import { radius, space, useTheme } from "@/theme";

type Category = Doc<"categories">;

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const categories = useQuery(api.categories.getCategories);
  const addCategory = useMutation(api.categories.addCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_CHOICES[0]!);
  const [icon, setIcon] = useState(ICON_CHOICES[0]!);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const { visible, defaults, custom } = useMemo(() => {
    const list = (categories ?? []).filter((category) => category.type === tab);
    return {
      visible: list,
      defaults: list.filter((category) => category.isDefault),
      custom: list.filter((category) => !category.isDefault),
    };
  }, [categories, tab]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setColor(COLOR_CHOICES[0]!);
    setIcon(ICON_CHOICES[0]!);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon);
    setFormOpen(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await updateCategory({ id: editing._id, name: name.trim(), icon, color });
        toast.success("Category updated");
      } else {
        await addCategory({ name: name.trim(), type: tab, icon, color });
        toast.success("Category created");
      }
      haptic("success");
      setFormOpen(false);
    } catch (error) {
      haptic("error");
      toast.error(
        error instanceof Error ? error.message : "Couldn't save that category"
      );
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id as Id<"categories">;
    setPendingDelete(null);
    try {
      await deleteCategory({ id });
      haptic("success");
      toast.success("Category deleted");
    } catch (error) {
      haptic("error");
      toast.error(
        error instanceof Error && error.message.includes("transaction")
          ? "That category still has transactions linked to it"
          : "Couldn't delete that category"
      );
    }
  };

  return (
    <Screen header={<AppHeader title="Categories" />} withTabBar={false}>
      <View style={{ gap: 2 }}>
        <Text variant="title">Categories</Text>
        <Text variant="caption" tone="secondary">
          {categories ? `${defaults.length} built-in · ${custom.length} custom` : "Loading…"}
        </Text>
      </View>

      <Button
        block
        label="New category"
        icon={<Plus size={16} color="#fff" />}
        onPress={openCreate}
      />

      <SegmentedControl
        segments={[
          { value: "expense", label: "Expenses" },
          { value: "income", label: "Income" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {categories === undefined ? (
        <Card>
          <SkeletonList rows={6} />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Shapes}
            title="No categories here"
            description="Create one to start sorting your transactions."
            action={<Button label="Create category" size="sm" onPress={openCreate} />}
          />
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {visible.map((category, index) => (
            <Animated.View
              key={category._id}
              entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}
            >
              <Card
                padded="md"
                style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
              >
                <CategoryIcon
                  name={category.icon}
                  color={category.color}
                  size={19}
                  tileSize={44}
                />
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                  }}
                >
                  <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {category.name}
                  </Text>
                  {category.isDefault ? <Badge label="Built-in" /> : null}
                </View>

                {!category.isDefault ? (
                  <>
                    <IconButton
                      accessibilityLabel={`Edit ${category.name}`}
                      size={34}
                      icon={<Pencil size={15} color={colors.textSecondary} />}
                      onPress={() => openEdit(category)}
                    />
                    <IconButton
                      accessibilityLabel={`Delete ${category.name}`}
                      size={34}
                      icon={<Trash2 size={15} color={colors.danger} />}
                      onPress={() => setPendingDelete(category)}
                    />
                  </>
                ) : null}
              </Card>
            </Animated.View>
          ))}
        </View>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editing ? "Edit category" : `New ${tab === "income" ? "income" : "expense"} category`
        }
        footer={
          <Button
            block
            style={{ flex: 1 }}
            label={editing ? "Save changes" : "Create category"}
            disabled={!name.trim()}
            onPress={submit}
          />
        }
      >
        <View
          style={{
            alignItems: "center",
            gap: space.md,
            padding: space.xl,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.bgCard,
          }}
        >
          <CategoryIcon name={icon} color={color} size={24} tileSize={56} />
          <Text variant="heading" style={{ fontSize: 18, textAlign: "center" }}>
            {name.trim() || "Category name"}
          </Text>
        </View>

        <Field label="Name">
          <TextField
            inSheet
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gym, Side hustle"
            maxLength={40}
          />
        </Field>

        <Field label="Colour">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {COLOR_CHOICES.map((choice) => (
              <PressableScale
                key={choice}
                scaleTo={0.88}
                onPress={() => setColor(choice)}
                accessibilityLabel={`Colour ${choice}`}
                accessibilityState={{ selected: color === choice }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.sm,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: choice,
                  borderWidth: color === choice ? 3 : 1,
                  borderColor: color === choice ? colors.text : "rgba(255,255,255,0.14)",
                }}
              >
                {color === choice ? <Check size={16} color="#fff" /> : null}
              </PressableScale>
            ))}
          </View>
        </Field>

        <Field label="Icon">
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {ICON_CHOICES.map((choice) => (
                <PressableScale
                  key={choice}
                  scaleTo={0.88}
                  onPress={() => setIcon(choice)}
                  accessibilityLabel={choice}
                  accessibilityState={{ selected: icon === choice }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: icon === choice ? 2 : 1,
                    backgroundColor: icon === choice ? colors.bgElevated : colors.bgCard,
                    borderColor: icon === choice ? color : colors.border,
                  }}
                >
                  <CategoryIcon
                    name={choice}
                    color={icon === choice ? color : colors.textSecondary}
                    size={19}
                    tile={false}
                  />
                </PressableScale>
              ))}
            </View>
          </ScrollView>
        </Field>

        <View style={{ height: space.sm }} />
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete category?"
        message={`"${pendingDelete?.name}" will be removed. Categories with transactions attached can't be deleted.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}
