import { useEffect, useMemo, useState } from "react";
import { SectionList, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { formatDayLabel, formatTime } from "@shared/format";
import HomeHeader from "@/components/layout/HomeHeader";
import Text, { Overline } from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Chip from "@/components/ui/Chip";
import TextField from "@/components/ui/TextField";
import Badge from "@/components/ui/Badge";
import CategoryIcon from "@/components/ui/CategoryIcon";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PressableScale from "@/components/ui/PressableScale";
import { SkeletonList } from "@/components/ui/Skeleton";
import EditTransactionSheet from "@/components/transactions/EditTransactionSheet";
import FilterSheet, { type TypeFilter } from "@/components/transactions/FilterSheet";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useAddTransaction } from "@/providers/AddTransactionProvider";
import { exportTransactionsCsv, pickTransactionsCsv } from "@/lib/csvFiles";
import { haptic } from "@/lib/haptics";
import { fonts, fontSize, layout, radius, space, useTheme } from "@/theme";

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { format } = useCurrency();
  const { openAdd } = useAddTransaction();
  const params = useLocalSearchParams<{ category?: string; type?: string }>();

  const categories = useQuery(api.categories.getCategories) ?? [];
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);
  const importTransactions = useMutation(api.migration.importTransactions);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"transactions"> | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Doc<"transactions"> | null>(null);
  const [busy, setBusy] = useState(false);

  // Deep links from the dashboard breakdown arrive as route params.
  useEffect(() => {
    if (params.category) setCategoryFilter(params.category);
    if (params.type === "income" || params.type === "expense") setTypeFilter(params.type);
  }, [params.category, params.type]);

  const queryArgs: { type?: "income" | "expense"; startDate?: number; endDate?: number } = {};
  if (typeFilter !== "all") queryArgs.type = typeFilter;
  if (startDate) queryArgs.startDate = startDate.getTime();
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    queryArgs.endDate = end.getTime();
  }

  const transactions = useQuery(api.transactions.getTransactions, queryArgs);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category._id as string, category])),
    [categories]
  );

  const filtered = useMemo(() => {
    if (!transactions) return undefined;
    const term = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (categoryFilter && transaction.categoryId !== categoryFilter) return false;
      if (!term) return true;
      const categoryName = categoryById.get(transaction.categoryId)?.name ?? "";
      return (
        (transaction.description ?? "").toLowerCase().includes(term) ||
        categoryName.toLowerCase().includes(term) ||
        String(transaction.amount).includes(term)
      );
    });
  }, [transactions, search, categoryFilter, categoryById]);

  /** Grouped into day buckets so the list reads like a statement. */
  const sections = useMemo(() => {
    if (!filtered) return [];
    const buckets = new Map<string, { title: string; total: number; data: Doc<"transactions">[] }>();

    for (const transaction of filtered) {
      const day = new Date(transaction.date);
      day.setHours(0, 0, 0, 0);
      const key = String(day.getTime());
      if (!buckets.has(key)) {
        buckets.set(key, { title: formatDayLabel(transaction.date), total: 0, data: [] });
      }
      const bucket = buckets.get(key)!;
      bucket.data.push(transaction);
      bucket.total += transaction.type === "income" ? transaction.amount : -transaction.amount;
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([key, value]) => ({ key, ...value }));
  }, [filtered]);

  const totals = useMemo(() => {
    const income = (filtered ?? [])
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = (filtered ?? [])
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const activeFilters =
    (typeFilter !== "all" ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter("all");
    setCategoryFilter("");
    setStartDate(null);
    setEndDate(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id;
    setPendingDelete(null);
    try {
      await deleteTransaction({ id });
      haptic("success");
      toast.success("Transaction deleted");
    } catch {
      haptic("error");
      toast.error("Couldn't delete that transaction");
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const rows = await pickTransactionsCsv();
      if (!rows) return;
      if (rows.length === 0) {
        toast.error("No valid rows found in that CSV");
        return;
      }
      const result = await importTransactions({ transactions: rows });
      haptic("success");
      toast.success(`Imported ${result.count} transactions`);
    } catch {
      toast.error("Import failed — check the CSV format");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    const rows = filtered ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    setBusy(true);
    try {
      await exportTransactionsCsv(
        rows.map((transaction) => ({
          date: transaction.date,
          type: transaction.type,
          category: categoryById.get(transaction.categoryId)?.name ?? "Unknown",
          description: transaction.description,
          amount: transaction.amount,
        }))
      );
    } catch {
      toast.error("Couldn't export those transactions");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HomeHeader />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={14}
        maxToRenderPerBatch={12}
        windowSize={9}
        removeClippedSubviews
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: layout.tabBarHeight + insets.bottom + space["2xl"],
        }}
        ListHeaderComponent={
          <View style={{ gap: space.lg, paddingTop: space.md, paddingBottom: space.sm }}>
            <View style={{ gap: 2 }}>
              <Text variant="title">Transactions</Text>
              <Text variant="caption" tone="secondary">
                {filtered
                  ? `${filtered.length} entr${filtered.length === 1 ? "y" : "ies"}`
                  : "Loading…"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <Button
                label="Import"
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
                block
                disabled={busy}
                icon={<ArrowDownToLine size={15} color={colors.text} />}
                onPress={handleImport}
              />
              <Button
                label="Export"
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
                block
                disabled={busy || !filtered?.length}
                icon={<ArrowUpFromLine size={15} color={colors.text} />}
                onPress={handleExport}
              />
            </View>

            <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
              <View style={{ flex: 1, position: "relative", justifyContent: "center" }}>
                <Search
                  size={16}
                  color={colors.textMuted}
                  style={{ position: "absolute", left: space.md, zIndex: 1 }}
                />
                <TextField
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search transactions"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  style={{ paddingLeft: 42, backgroundColor: colors.bgCard }}
                />
              </View>

              <View>
                <IconButton
                  bordered
                  size={48}
                  accessibilityLabel="Filters"
                  icon={
                    <SlidersHorizontal
                      size={18}
                      color={activeFilters ? colors.accent : colors.textSecondary}
                    />
                  }
                  onPress={() => setFiltersOpen(true)}
                  style={{
                    borderRadius: radius.md,
                    backgroundColor: activeFilters ? colors.accentSofter : colors.bgCard,
                    borderColor: activeFilters ? colors.accentRing : colors.border,
                  }}
                />
                {activeFilters > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 4,
                      borderRadius: radius.full,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.accent,
                      borderWidth: 2,
                      borderColor: colors.bg,
                    }}
                  >
                    <Text
                      style={{ fontFamily: fonts.bold, fontSize: 10, color: "#fff" }}
                    >
                      {activeFilters}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {activeFilters > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {typeFilter !== "all" ? (
                  <Chip
                    active
                    label={typeFilter === "income" ? "Income" : "Expenses"}
                    icon={<X size={12} color={colors.accent} />}
                    onPress={() => setTypeFilter("all")}
                  />
                ) : null}
                {categoryFilter ? (
                  <Chip
                    active
                    label={categoryById.get(categoryFilter)?.name ?? "Category"}
                    icon={<X size={12} color={colors.accent} />}
                    onPress={() => setCategoryFilter("")}
                  />
                ) : null}
                {startDate ? (
                  <Chip
                    active
                    label={`From ${startDate.toLocaleDateString()}`}
                    icon={<X size={12} color={colors.accent} />}
                    onPress={() => setStartDate(null)}
                  />
                ) : null}
                {endDate ? (
                  <Chip
                    active
                    label={`To ${endDate.toLocaleDateString()}`}
                    icon={<X size={12} color={colors.accent} />}
                    onPress={() => setEndDate(null)}
                  />
                ) : null}
                <Chip label="Clear all" onPress={clearFilters} />
              </View>
            ) : null}

            {filtered && filtered.length > 0 ? (
              <Animated.View
                entering={FadeIn.duration(240)}
                style={{
                  flexDirection: "row",
                  padding: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.bgCard,
                }}
              >
                <Total label="In" value={format(totals.income, { decimals: false })} tone={colors.income} />
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <Total label="Out" value={format(totals.expense, { decimals: false })} tone={colors.expense} />
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <Total
                  label="Net"
                  value={format(totals.net, { decimals: false })}
                  tone={totals.net >= 0 ? colors.income : colors.expense}
                />
              </Animated.View>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              paddingTop: space.md,
              paddingBottom: space.sm,
              paddingHorizontal: space.xs,
            }}
          >
            <Overline>{section.title}</Overline>
            <Text
              style={{
                fontFamily: fonts.numeric,
                fontSize: fontSize.xs,
                color: section.total >= 0 ? colors.income : colors.textSecondary,
              }}
            >
              {section.total >= 0 ? "+" : "−"}
              {format(Math.abs(section.total))}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const category = categoryById.get(item.categoryId);
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;

          return (
            <PressableScale
              onPress={() => setEditing(item)}
              scaleTo={0.985}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.bgCard,
                borderTopWidth: isFirst ? 1 : 0,
                borderTopLeftRadius: isFirst ? radius.lg : 0,
                borderTopRightRadius: isFirst ? radius.lg : 0,
                borderBottomLeftRadius: isLast ? radius.lg : 0,
                borderBottomRightRadius: isLast ? radius.lg : 0,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.md,
                  padding: space.md,
                }}
              >
                <CategoryIcon
                  name={category?.icon}
                  color={category?.color ?? "#71717a"}
                  size={17}
                  tileSize={40}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.description || category?.name || "Transaction"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {formatTime(item.date)} · {category?.name ?? "Unknown"}
                    </Text>
                    {item.splitGroupId ? <Badge label="Split" tone="accent" /> : null}
                  </View>
                </View>
                <Text
                  style={{
                    fontFamily: fonts.numeric,
                    fontSize: fontSize.base,
                    color: item.type === "income" ? colors.income : colors.text,
                  }}
                >
                  {item.type === "income" ? "+" : "−"}
                  {format(item.amount)}
                </Text>
              </View>
            </PressableScale>
          );
        }}
        ListEmptyComponent={
          filtered === undefined ? (
            <Card>
              <SkeletonList rows={7} />
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={Receipt}
                title={
                  activeFilters || search
                    ? "Nothing matches those filters"
                    : "No transactions yet"
                }
                description={
                  activeFilters || search
                    ? "Try widening your search or clearing a filter."
                    : "Track your first income or expense to get started."
                }
                action={
                  activeFilters || search ? (
                    <Button
                      label="Clear filters"
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        clearFilters();
                        setSearch("");
                      }}
                    />
                  ) : (
                    <Button label="Add transaction" size="sm" onPress={() => openAdd()} />
                  )
                }
              />
            </Card>
          )
        }
      />

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        categories={categories}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        startDate={startDate}
        endDate={endDate}
        onStartDate={setStartDate}
        onEndDate={setEndDate}
        onReset={clearFilters}
      />

      <EditTransactionSheet
        transaction={editing}
        onClose={() => setEditing(null)}
        onDelete={(transaction) => {
          setEditing(null);
          setPendingDelete(transaction);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete transaction?"
        message={
          pendingDelete
            ? `${
                pendingDelete.description ||
                categoryById.get(pendingDelete.categoryId)?.name ||
                "This transaction"
              } for ${format(pendingDelete.amount)} will be removed permanently.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

function Total({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Overline>{label}</Overline>
      <Text
        numberOfLines={1}
        style={{ fontFamily: fonts.numeric, fontSize: fontSize.sm, color: tone }}
      >
        {value}
      </Text>
    </View>
  );
}
