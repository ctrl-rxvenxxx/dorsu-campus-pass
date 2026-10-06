import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowDownToLine as DownloadIcon,
  ArrowLeft as BackIcon,
  ArrowRight as ForwardIcon,
  Battery as BatteryIcon,
  Bell as BellIcon,
  Bluetooth as BluetoothIcon,
  Boxes as BoxesIcon,
  ChartNoAxesColumnIncreasing as ChartIcon,
  Check as CheckIcon,
  ChevronRight as ChevronIcon,
  CreditCard as CardIcon,
  FileText as FileIcon,
  Home as HomeIcon,
  MapPin as LocationIcon,
  MoreHorizontal as MoreIcon,
  Package as PackageIcon,
  Plus as PlusIcon,
  Printer as PrinterIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Share2 as ShareIcon,
  ShoppingBag as StoreIcon,
  ShoppingCart as CartIcon,
  Signal as SignalIcon,
  Smartphone as PhoneIcon,
  Trash2 as TrashIcon,
  UserRound as UserRoundIcon,
  Wallet as WalletIcon,
  Wifi as WifiIcon,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  addInventoryProduct,
  changeInventoryStock,
  getInventoryProducts,
  initializeInventory,
  removeInventoryProduct,
  type InventoryProduct,
} from '../services/inventory';

type Screen = 'Dashboard' | 'Inventory' | 'POS' | 'Reports' | 'Profile' | 'Suppliers' | 'Cart' | 'Payment' | 'Receipt';
type Product = InventoryProduct;
const navItems: { label: Extract<Screen, 'Dashboard' | 'Inventory' | 'POS' | 'Reports' | 'Profile'>; icon: LucideIcon }[] = [
  { label: 'Dashboard', icon: HomeIcon }, { label: 'Inventory', icon: BoxesIcon }, { label: 'POS', icon: CartIcon },
  { label: 'Reports', icon: ChartIcon }, { label: 'Profile', icon: UserRoundIcon },
];
const screenTitles: Record<Screen, string> = {
  Dashboard: 'StockPoint', Inventory: 'Inventory', POS: 'POS', Reports: 'Reports', Profile: 'Profile',
  Suppliers: 'Suppliers', Cart: 'Cart', Payment: 'Payment', Receipt: 'Receipt',
};
const peso = (amount: number, decimals = 0) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export default function StockPointApp() {
  const [screen, setScreen] = useState<Screen>('Dashboard');
  const [storeName, setStoreName] = useState('Raven Mini Mart');
  const [ownerName, setOwnerName] = useState('Jhon Raven Rubio');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [profileDialogVisible, setProfileDialogVisible] = useState(false);
  const [draftStoreName, setDraftStoreName] = useState('Raven Mini Mart');
  const [draftOwnerName, setDraftOwnerName] = useState('Jhon Raven Rubio');
  const [draftAvatarUri, setDraftAvatarUri] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash' | 'Card'>('Cash');
  const [cashReceived, setCashReceived] = useState('300');
  const [productDialogVisible, setProductDialogVisible] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [notice, setNotice] = useState('');
  const productLoadRequest = useRef(0);

  const loadProducts = async (search = query) => {
    const request = ++productLoadRequest.current;
    try {
      const [allRows, matchingRows] = await Promise.all([
        getInventoryProducts(''),
        getInventoryProducts(search),
      ]);
      if (request === productLoadRequest.current) {
        setProducts(allRows);
        setSearchResults(matchingRows);
      }
    } catch (error) {
      console.error('Failed to load inventory products.', error);
      setNotice('Could not load inventory from SQLite');
    }
  };

  useEffect(() => {
    let isMounted = true;
    initializeInventory()
      .then(() => {
        if (isMounted) return loadProducts('');
      })
      .catch((error) => {
        console.error('Failed to initialize the inventory database.', error);
        setNotice('Could not initialize the SQLite database');
      });
    return () => {
      isMounted = false;
      productLoadRequest.current += 1;
    };
  }, []);

  const cartEntries = useMemo(() => products.flatMap((product) => cart[product.id] ? [{ ...product, quantity: cart[product.id] }] : []), [cart, products]);
  const itemCount = cartEntries.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartEntries.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const categories = useMemo(() => ['All', ...new Set(products.map((product) => product.category))], [products]);
  const filteredProducts = searchResults.filter((product) => (category === 'All' || category === product.category) && (!lowStockOnly || product.stock < 10));
  const unitsInStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStockCount = products.filter((product) => product.stock < 10).length;
  const activeTab = (['Suppliers', 'Cart', 'Payment', 'Receipt'] as Screen[]).includes(screen) ? 'POS' : screen;

  const updateQuantity = (id: string, delta: number) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setCart((current) => {
      const next = (current[id] ?? 0) + delta;
      if (next > product.stock) {
        setNotice(`Only ${product.stock} ${product.name} in stock`);
        return current;
      }
      if (next <= 0) {
        const updated = { ...current };
        delete updated[id];
        return updated;
      }
      return { ...current, [id]: next };
    });
  };
  const beginSale = () => { setScreen('POS'); setQuery(''); setCategory('All'); loadProducts(''); };
  const editProfile = () => {
    setDraftStoreName(storeName);
    setDraftOwnerName(ownerName);
    setDraftAvatarUri(avatarUri);
    setProfileDialogVisible(true);
  };
  const chooseProfileAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice('Allow photo library access to choose an avatar');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setDraftAvatarUri(result.assets[0].uri);
    }
  };
  const saveProfile = () => {
    const nextStoreName = draftStoreName.trim();
    const nextOwnerName = draftOwnerName.trim();
    if (!nextStoreName || !nextOwnerName) {
      setNotice('Store and owner names cannot be empty');
      return;
    }
    setStoreName(nextStoreName);
    setOwnerName(nextOwnerName);
    setAvatarUri(draftAvatarUri);
    setProfileDialogVisible(false);
    setNotice('Profile updated');
  };
  const confirmPayment = async () => {
    try {
      for (const item of cartEntries) {
        const updated = await changeInventoryStock(item.id, -item.quantity);
        if (!updated) throw new Error(`Could not update stock for ${item.name}`);
      }
      await loadProducts('');
      setScreen('Receipt');
    } catch (error) {
      console.error('Failed to complete the sale and update inventory.', error);
      setNotice('Sale could not be completed. Check the stock and try again.');
      await loadProducts('');
    }
  };
  const createProduct = async () => {
    const name = newProductName.trim();
    const productCategory = newProductCategory.trim();
    const price = Number(newProductPrice);
    const stock = Number(newProductStock);
    if (!name || !productCategory || !newProductPrice || !newProductStock || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setNotice('Enter a name, category, valid price, and whole-number stock');
      return;
    }
    try {
      await addInventoryProduct({ name, category: productCategory, price, stock });
      setProductDialogVisible(false);
      setNewProductName('');
      setNewProductCategory('');
      setNewProductPrice('');
      setNewProductStock('');
      await loadProducts('');
      setQuery('');
      setCategory('All');
      setNotice(`${name} added to your catalog`);
    } catch (error) {
      console.error('Failed to add an inventory product.', error);
      setNotice('Could not save the product to SQLite');
    }
  };
  const adjustStock = async (product: Product, adjustment: number) => {
    try {
      const updated = await changeInventoryStock(product.id, adjustment);
      if (!updated) {
        setNotice('Stock cannot be lower than zero');
        return;
      }
      await loadProducts();
    } catch (error) {
      console.error('Failed to adjust inventory stock.', error);
      setNotice('Could not update product stock');
    }
  };
  const deleteProduct = (product: Product) => {
    const remove = async () => {
      try {
        await removeInventoryProduct(product.id);
        setCart((current) => {
          const updated = { ...current };
          delete updated[product.id];
          return updated;
        });
        await loadProducts();
        setNotice(`${product.name} removed from inventory`);
      } catch (error) {
        console.error('Failed to delete an inventory product.', error);
        setNotice('Could not delete the product');
      }
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm(`Remove ${product.name}?`)) void remove();
      return;
    }
    Alert.alert('Delete product', `Remove ${product.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  const renderStatusBar = () => (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>10:42</Text>
      <View style={styles.statusIcons}><SignalIcon size={15} color={colors.ink} strokeWidth={2.4} /><WifiIcon size={15} color={colors.ink} strokeWidth={2.4} /><BatteryIcon size={16} color={colors.ink} strokeWidth={2.2} /></View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.appBar}>
      {['Suppliers', 'Cart', 'Payment', 'Receipt'].includes(screen) ? (
        <Pressable onPress={() => setScreen(screen === 'Cart' ? 'POS' : screen === 'Payment' ? 'Cart' : 'Dashboard')} style={styles.headerBack} accessibilityLabel="Go back"><BackIcon size={21} color={colors.ink} /></Pressable>
      ) : null}
      <Text style={styles.appTitle}>{screenTitles[screen]}</Text>
      {screen === 'Dashboard' ? <Pressable style={styles.headerAction} accessibilityLabel="Notifications" onPress={() => setNotice('You are all caught up')}><BellIcon size={20} color={colors.ink} /><View style={styles.notificationDot} /></Pressable>
        : screen === 'Inventory' ? <Pressable style={styles.headerAction} accessibilityLabel="More inventory options" onPress={() => setNotice('Inventory is synced')}><MoreIcon size={22} color={colors.ink} /></Pressable>
          : screen === 'POS' ? <Pressable style={styles.headerAction} accessibilityLabel="Scan barcode" onPress={() => setNotice('Barcode scanner ready')}><StoreIcon size={20} color={colors.ink} /></Pressable>
            : <View style={styles.headerActionPlaceholder} />}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.bottomBar}><View style={styles.bottomNav}>
      {navItems.map(({ label, icon: Icon }) => {
        const selected = activeTab === label;
        return <Pressable key={label} style={styles.navItem} onPress={() => setScreen(label)} accessibilityRole="button" accessibilityLabel={label}>
          <View style={[styles.navIconWrap, selected && styles.navIconSelected]}><Icon size={20} color={selected ? colors.tealDark : colors.muted} strokeWidth={2.1} /></View>
          <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{label}</Text>
        </Pressable>;
      })}
    </View></View>
  );

  const renderCategoryFilters = () => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filterChip, category === item && styles.filterChipSelected]}><Text style={[styles.filterText, category === item && styles.filterTextSelected]}>{item}</Text></Pressable>)}</ScrollView>;

  const renderProductCard = (product: Product, mode: 'inventory' | 'sale') => {
    const quantity = cart[product.id] ?? 0;
    return <View key={product.id} style={styles.productRow}>
      <View style={[styles.productIcon, product.category.toLowerCase().includes('drink') && styles.productIconDrinks]}><PackageIcon size={21} color={colors.tealDark} strokeWidth={1.8} /></View>
      <View style={styles.productInfo}><Text style={styles.productName} numberOfLines={1}>{product.name}</Text><Text style={styles.productDetail} numberOfLines={1}>{product.detail}{mode === 'inventory' ? ` • ${peso(product.price)}` : ''}</Text></View>
      {mode === 'inventory' ? <View style={styles.inventoryActions}>
        <View style={styles.stockInfo}><Text style={[styles.stockNumber, product.stock < 10 && styles.stockNumberLow]}>{product.stock}</Text><Text style={[styles.stockUnit, product.stock < 10 && styles.lowTag]}>{product.stock < 10 ? 'Low' : 'units'}</Text></View>
        <Pressable onPress={() => void adjustStock(product, -1)} disabled={product.stock <= 0} style={styles.inventoryIconButton} accessibilityLabel={`Decrease ${product.name} stock`}><Text style={[styles.inventoryStockSymbol, product.stock <= 0 && styles.disabledAction]}>−</Text></Pressable>
        <Pressable onPress={() => void adjustStock(product, 1)} style={styles.inventoryIconButton} accessibilityLabel={`Increase ${product.name} stock`}><Text style={styles.inventoryStockSymbol}>+</Text></Pressable>
        <Pressable onPress={() => deleteProduct(product)} style={styles.inventoryIconButton} accessibilityLabel={`Delete ${product.name}`}><TrashIcon size={16} color={colors.danger} /></Pressable>
      </View>
        : <View style={styles.saleAction}><Text style={styles.salePrice}>{peso(product.price)}</Text>{quantity > 0
          ? <View style={styles.inlineQuantity}><Pressable onPress={() => updateQuantity(product.id, -1)} style={styles.miniQuantityButton} accessibilityLabel={`Remove one ${product.name}`}><Text style={styles.miniQuantityText}>−</Text></Pressable><Text style={styles.inlineQuantityValue}>{quantity}</Text><Pressable onPress={() => updateQuantity(product.id, 1)} disabled={quantity >= product.stock} style={[styles.miniQuantityButton, quantity >= product.stock && styles.disabledAction]} accessibilityLabel={`Add one ${product.name}`}><Text style={styles.miniQuantityText}>+</Text></Pressable></View>
          : <Pressable onPress={() => updateQuantity(product.id, 1)} disabled={product.stock <= 0} style={[styles.addButton, product.stock <= 0 && styles.disabledAction]} accessibilityLabel={`Add ${product.name}`}><PlusIcon size={17} color={colors.tealDark} /></Pressable>}</View>}
    </View>;
  };

  const renderDashboard = () => <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <View style={styles.greetingText}><Text style={styles.greetingTitle}>Magandang umaga, {ownerName.split(' ')[0]}!</Text><Text style={styles.greetingSub}>{storeName} • Sat, 03 Oct 2026</Text></View>
    <View style={styles.salesCard}><View style={styles.cardLabelRow}><Text style={styles.salesLabel}>Today's Sales</Text><ChartIcon size={20} color={colors.ink} /></View><Text style={styles.salesAmount}>₱24,580</Text><Text style={styles.salesComparison}>↑ 12.8% vs. yesterday • ₱2,790 more</Text></View>
    <View style={styles.metricsGrid}><MetricTile label="Items in Stock" value={unitsInStock.toLocaleString()} context={`${products.length} products`} /><MetricTile label="Low Stock" value={String(lowStockCount)} context="Needs restocking" /><MetricTile label="Transactions" value="128" context="Today" /><MetricTile label="Pending Orders" value="3" context="₱18,450 total" /></View>
    <View style={styles.sectionBlock}><Text style={styles.sectionTitle}>Quick actions</Text><View style={styles.quickActions}><QuickAction label="New sale" icon={CartIcon} tone="orange" onPress={beginSale} /><QuickAction label="Add stock" icon={PackageIcon} tone="mint" onPress={() => setScreen('Inventory')} /><QuickAction label="Suppliers" icon={BoxesIcon} tone="mint" onPress={() => setScreen('Suppliers')} /></View></View>
    <Pressable style={styles.restockCard} onPress={() => { setLowStockOnly(true); setScreen('Inventory'); }}><View style={styles.cardLabelRow}><Text style={styles.restockTitle}>Stock needs attention</Text><Text style={styles.viewAll}>View all →</Text></View><Text style={styles.restockText}>{products.filter((product) => product.stock < 10).slice(0, 3).map((product) => `${product.name}: ${product.stock} left`).join(' • ') || 'No products are low on stock'}</Text></Pressable>
  </ScrollView>;

  const renderInventory = () => <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <View style={styles.searchField}><SearchIcon size={19} color={colors.muted} /><TextInput value={query} onChangeText={(text) => { setQuery(text); void loadProducts(text); }} placeholder="Search product name" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
    <View style={styles.chipRow}><Pressable style={[styles.filterChip, !lowStockOnly && styles.filterChipSelected]} onPress={() => setLowStockOnly(false)}><Text style={[styles.filterText, !lowStockOnly && styles.filterTextSelected]}>All products</Text></Pressable><Pressable style={[styles.filterChip, lowStockOnly && styles.filterChipSelected]} onPress={() => setLowStockOnly((current) => !current)}><Text style={[styles.filterText, lowStockOnly && styles.filterTextSelected]}>Low stock · {lowStockCount}</Text></Pressable></View>
    {renderCategoryFilters()}
    <View style={styles.inventorySummary}><View><Text style={styles.stockTotal}>{unitsInStock.toLocaleString()}</Text><Text style={styles.summaryLabel}>units in stock • {products.length} products</Text></View><Pressable style={styles.addProductButton} onPress={() => setProductDialogVisible(true)} accessibilityLabel="Add product"><PlusIcon size={23} color={colors.paper} /></Pressable></View>
    <View style={styles.listPanel}>{filteredProducts.map((product) => renderProductCard(product, 'inventory'))}{filteredProducts.length === 0 ? <Text style={styles.emptyInventory}>No products match your filters.</Text> : null}</View><Text style={styles.syncLabel}>Stored on this device • Showing {filteredProducts.length} of {products.length} products</Text>
  </ScrollView>;

  const renderSuppliers = () => <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <View style={styles.salesCard}><View style={styles.cardLabelRow}><Text style={styles.salesLabel}>3 pending orders</Text><FileIcon size={20} color={colors.ink} /></View><Text style={styles.salesAmount}>₱18,450</Text><Text style={styles.salesComparison}>Next delivery: Manila Wholesale, today</Text></View>
    <View style={styles.searchField}><SearchIcon size={19} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search suppliers" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
    <View style={styles.cardLabelRow}><Text style={styles.sectionTitle}>Your suppliers</Text><Text style={styles.supplierCount}>8 partners</Text></View>
    <View style={styles.listPanel}><SupplierRow initials="MW" name="Manila Wholesale" delivery="Due today • Awaiting delivery" order="PO-2041 • 24 items" amount="₱8,400" tone="lavender" /><SupplierRow initials="SM" name="San Miguel Foods" delivery="Tomorrow • Awaiting delivery" order="PO-2042 • 18 items" amount="₱6,250" tone="peach" /><SupplierRow initials="CC" name="Coca-Cola PH" delivery="Mon, 05 Oct • Awaiting delivery" order="PO-2043 • 12 cases" amount="₱3,800" tone="mint" /></View>
    <Pressable style={styles.primaryButton} onPress={() => setNotice('Purchase order draft created')}><PlusIcon size={18} color={colors.paper} /><Text style={styles.primaryButtonText}>Create purchase order</Text></Pressable>
  </ScrollView>;

  const renderPOS = () => <View style={styles.flexContent}><ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <Text style={styles.saleSubtitle}>New sale • Walk-in customer</Text><View style={styles.searchField}><SearchIcon size={19} color={colors.muted} /><TextInput value={query} onChangeText={(text) => { setQuery(text); void loadProducts(text); }} placeholder="Search or scan a product" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
    {renderCategoryFilters()}<View style={styles.saleListPanel}>{filteredProducts.map((product) => renderProductCard(product, 'sale'))}</View>
  </ScrollView><Pressable style={styles.cartBar} onPress={() => setScreen('Cart')}><View style={styles.cartBarBadge}><CartIcon size={18} color={colors.ink} /><Text style={styles.cartBarCount}>{itemCount}</Text></View><View style={styles.cartBarInfo}><Text style={styles.cartBarItems}>{itemCount} items • {cartEntries.length} products</Text><Text style={styles.cartBarTotal}>{peso(total)}</Text></View><View style={styles.cartBarAction}><Text style={styles.cartBarActionText}>View cart</Text><ForwardIcon size={16} color={colors.ink} /></View></Pressable></View>;

  const renderCart = () => <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <Text style={styles.cartMeta}>{itemCount} items • {cartEntries.length} products</Text><View style={styles.customerCard}><View style={styles.customerIcon}><UserRoundIcon size={19} color={colors.tealDark} /></View><Text style={styles.customerName}>Walk-in customer</Text><Pressable onPress={() => setNotice('Customer selected: Walk-in')}><Text style={styles.changeLink}>Change</Text></Pressable></View>
    <View style={styles.cartList}>{cartEntries.map((item) => <View key={item.id} style={styles.cartProduct}><View style={styles.productIcon}><PackageIcon size={20} color={colors.tealDark} /></View><View style={styles.productInfo}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{item.detail} • {peso(item.price)} each</Text><View style={styles.inlineQuantity}><Pressable onPress={() => updateQuantity(item.id, -1)} style={styles.miniQuantityButton}><Text style={styles.miniQuantityText}>−</Text></Pressable><Text style={styles.inlineQuantityValue}>{item.quantity}</Text><Pressable onPress={() => updateQuantity(item.id, 1)} style={styles.miniQuantityButton}><Text style={styles.miniQuantityText}>+</Text></Pressable></View></View><Text style={styles.cartLineAmount}>{peso(item.price * item.quantity)}</Text></View>)}</View>
    <View style={styles.summaryPanel}><SummaryRow label="Subtotal" value={peso(total, 2)} /><View style={styles.discountRow}><Text style={styles.summaryLabel}>Discount</Text><Text style={styles.summaryValue}>{peso(0, 2)}</Text></View><Pressable onPress={() => setNotice('Discount options opened')}><Text style={styles.addDiscount}>+ Add discount</Text></Pressable><View style={styles.totalDivider} /><SummaryRow label="Total" value={peso(total, 2)} strong /></View>
    <Pressable style={styles.primaryButton} onPress={() => setScreen('Payment')}><Text style={styles.primaryButtonText}>Proceed to payment</Text><ForwardIcon size={18} color={colors.paper} /></Pressable><Text style={styles.footnote}>Final price • No additional fees</Text>
  </ScrollView>;

  const renderPayment = () => {
    const cash = Number(cashReceived) || 0;
    const change = Math.max(0, cash - total);
    const methods: { label: 'Cash' | 'GCash' | 'Card'; icon: LucideIcon }[] = [{ label: 'Cash', icon: WalletIcon }, { label: 'GCash', icon: PhoneIcon }, { label: 'Card', icon: CardIcon }];
    return <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.paymentTotalCard}><Text style={styles.summaryLabel}>Total to pay</Text><Text style={styles.paymentAmount}>{peso(total, 2)}</Text><Text style={styles.productDetail}>{itemCount} items • Walk-in customer</Text></View>
      <Text style={styles.sectionTitle}>Payment method</Text><View style={styles.paymentMethods}>{methods.map(({ label, icon: Icon }) => { const selected = paymentMethod === label; return <Pressable key={label} onPress={() => setPaymentMethod(label)} style={[styles.paymentMethod, selected && styles.paymentMethodSelected]}><Icon size={19} color={selected ? colors.tealDark : colors.muted} /><Text style={[styles.paymentMethodText, selected && styles.paymentMethodTextSelected]}>{label}</Text>{selected && <CheckIcon size={16} color={colors.tealDark} />}</Pressable>; })}</View>
      <Text style={styles.fieldLabel}>{paymentMethod === 'Cash' ? 'Cash received' : `${paymentMethod} reference`}</Text><TextInput value={paymentMethod === 'Cash' ? cashReceived : ''} onChangeText={setCashReceived} keyboardType="decimal-pad" placeholder={paymentMethod === 'Cash' ? 'Enter amount' : 'Enter reference'} style={styles.moneyInput} />
      <View style={styles.changeCard}><View><Text style={styles.summaryLabel}>Change to return</Text><Text style={styles.changeAmount}>{peso(change, 2)}</Text></View><View style={styles.changeIcon}><ForwardIcon size={17} color={colors.tealDark} /></View></View>
      <Text style={styles.cashHint}>{paymentMethod === 'Cash' && cash >= total ? 'Cash covers the full amount' : paymentMethod === 'Cash' ? 'Enter enough cash to cover the total' : 'Payment will be verified when confirmed'}</Text>
      <View style={styles.transactionPanel}><Text style={styles.fieldLabel}>Transaction</Text><Text style={styles.transactionId}>SP-1024</Text></View>
      <Pressable style={[styles.primaryButton, paymentMethod === 'Cash' && cash < total && styles.buttonDisabled]} disabled={paymentMethod === 'Cash' && cash < total} onPress={confirmPayment}><CheckIcon size={18} color={colors.paper} /><Text style={styles.primaryButtonText}>Confirm payment • {peso(total)}</Text></Pressable><Text style={styles.footnote}>A receipt will be created after confirmation.</Text>
    </ScrollView>;
  };

  const renderReceipt = () => <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <View style={styles.receiptSuccess}><View style={styles.receiptCheck}><CheckIcon size={25} color={colors.tealDark} strokeWidth={2.6} /></View><Text style={styles.receiptHeading}>Payment received</Text><Text style={styles.receiptSub}>Sale completed. Stock updated.</Text></View>
    <View style={styles.receiptPaper}><Text style={styles.storeName}>{storeName}</Text><Text style={styles.receiptAddress}>24 Mabini St., Brgy. San Isidro, Pasig</Text><View style={styles.receiptDivider} /><View style={styles.receiptMetaRow}><Text style={styles.receiptMono}>SP-1024</Text><Text style={styles.receiptDetail}>03 Oct 2026 • 10:42 AM</Text></View><Text style={styles.receiptDetail}>Cashier: {ownerName} • Walk-in customer</Text><View style={styles.receiptDivider} />
      {cartEntries.map((item) => <View key={item.id} style={styles.receiptItem}><Text style={styles.receiptDetail}>{item.quantity} × {item.name}</Text><Text style={styles.receiptDetail}>{peso(item.price * item.quantity, 2)}</Text></View>)}
      <View style={styles.receiptDivider} /><SummaryRow label="Total paid" value={peso(total, 2)} strong /><SummaryRow label="Cash received" value={peso(Number(cashReceived) || total, 2)} /><SummaryRow label="Change" value={peso(Math.max(0, (Number(cashReceived) || 0) - total), 2)} /><Text style={styles.thankYou}>Salamat po! See you again.</Text></View>
    <View style={styles.receiptActions}><Pressable style={styles.secondaryButton} onPress={() => setNotice('Receipt sent to printer')}><PrinterIcon size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>Print</Text></Pressable><Pressable style={styles.secondaryButton} onPress={() => setNotice('Receipt ready to share')}><ShareIcon size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>Share</Text></Pressable></View>
    <Pressable style={styles.primaryButton} onPress={() => { setCart({}); setCashReceived('300'); beginSale(); }}><PlusIcon size={18} color={colors.paper} /><Text style={styles.primaryButtonText}>Start new sale</Text></Pressable>
  </ScrollView>;

  const renderReports = () => <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <View style={styles.reportTabs}>{['Today', 'This week', 'This month'].map((label, index) => <Pressable key={label} style={[styles.reportTab, index === 1 && styles.reportTabSelected]} onPress={() => setNotice(`${label} report selected`)}><Text style={[styles.reportTabText, index === 1 && styles.reportTabTextSelected]}>{label}</Text></Pressable>)}</View>
    <View style={styles.reportSalesCard}><Text style={styles.reportOverline}>Total sales • 27 Sep – 03 Oct</Text><Text style={styles.reportAmount}>₱151,820</Text><Text style={styles.reportComparison}>Today: ₱24,580 • ↑ 12.8% vs. yesterday</Text></View>
    <View style={styles.chartPanel}><View style={styles.cardLabelRow}><Text style={styles.sectionTitle}>Daily sales</Text><Text style={styles.chartUnit}>PHP · ₱25k max</Text></View><View style={styles.chart}>{[42, 62, 54, 76, 65, 92, 100].map((height, index) => <View key={index} style={styles.chartColumn}><View style={[styles.chartTrack, { height: `${height}%` }, index === 6 && styles.chartTrackToday]} /><Text style={styles.chartDay}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</Text></View>)}</View></View>
    <View style={styles.reportStats}><MetricTile label="Transactions" value="792" context="This week" /><MetricTile label="Average sale" value="₱191.69" context="Per transaction" compact /></View>
    <View style={styles.sectionBlock}><View style={styles.cardLabelRow}><Text style={styles.sectionTitle}>Top products this week</Text><Pressable onPress={() => setScreen('Inventory')}><Text style={styles.viewAll}>View all</Text></Pressable></View><View style={styles.listPanel}><TopProduct name="Sinandomeng Rice" detail="220 kg" amount="₱12,100" rank="01" /><TopProduct name="Coca-Cola" detail="140 bottles" amount="₱10,500" rank="02" /></View></View>
  </ScrollView>;

  const renderProfile = () => <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
    <View style={styles.storeProfile}><View style={styles.storeAvatar}><StoreIcon size={25} color={colors.tealDark} /></View><Text style={styles.storeProfileName}>{storeName}</Text><View style={styles.locationRow}><LocationIcon size={14} color={colors.muted} /><Text style={styles.locationText}>San Isidro, Pasig City</Text></View><Text style={styles.storeStatus}>Store SP-001 • Main branch • Open</Text></View>
    <Pressable style={styles.ownerCard} onPress={editProfile} accessibilityRole="button" accessibilityLabel="Edit profile"><View style={styles.ownerAvatar}>{avatarUri ? <Image source={{ uri: avatarUri }} style={styles.ownerAvatarImage} /> : <Text style={styles.ownerInitials}>{ownerName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</Text>}</View><View style={styles.ownerInfo}><Text style={styles.ownerName}>{ownerName}</Text><Text style={styles.ownerRole}>Owner • Full access</Text></View><Text style={styles.editProfileLabel}>Edit</Text><ChevronIcon size={19} color={colors.muted} /></Pressable>
    <Text style={styles.settingsHeading}>Store settings</Text><View style={styles.settingsPanel}><SettingRow icon={SettingsIcon} title="Business & taxes" onPress={() => setNotice('Business settings opened')} /><SettingRow icon={BellIcon} title="Notifications" onPress={() => setNotice('Notification settings opened')} /><SettingRow icon={BoxesIcon} title="Stock & orders" onPress={() => setScreen('Inventory')} /><SettingRow icon={PrinterIcon} title="Printer & receipts" onPress={() => setNotice('Printer settings opened')} /><SettingRow icon={BluetoothIcon} title="Bluetooth printer" detail="Not connected" onPress={() => setNotice('Searching for printers')} /></View>
    <Text style={styles.settingsHeading}>Appearance</Text><View style={styles.settingsPanel}><SettingRow icon={PhoneIcon} title="Display preferences" onPress={() => setNotice('Display preferences opened')} /><SettingRow icon={DownloadIcon} title="Backup & sync" detail="All changes synced" onPress={() => setNotice('All changes are synced')} /></View>
    <Pressable style={styles.signOutButton} onPress={() => setNotice('You are signed out')}><Text style={styles.signOutText}>Sign out</Text></Pressable><Text style={styles.appVersion}>StockPoint v1.0.0 • Built for your tindahan</Text>
  </ScrollView>;

  const renderScreen = () => {
    switch (screen) {
      case 'Dashboard': return renderDashboard();
      case 'Inventory': return renderInventory();
      case 'Suppliers': return renderSuppliers();
      case 'POS': return renderPOS();
      case 'Cart': return renderCart();
      case 'Payment': return renderPayment();
      case 'Receipt': return renderReceipt();
      case 'Reports': return renderReports();
      case 'Profile': return renderProfile();
    }
  };

  return <View style={styles.safeArea}><StatusBar barStyle="dark-content" backgroundColor={colors.background} /><View style={styles.appShell}>
    {renderStatusBar()}{renderHeader()}<View style={styles.pageBody}>{renderScreen()}</View>{renderTabs()}<View style={styles.gestureArea}><View style={styles.gestureHandle} /></View>
  </View>
    {notice ? <Pressable style={styles.toast} onPress={() => setNotice('')}><Text style={styles.toastText}>{notice}</Text><Text style={styles.toastDismiss}>×</Text></Pressable> : null}
    <Modal visible={productDialogVisible} transparent animationType="fade" onRequestClose={() => setProductDialogVisible(false)}><View style={styles.modalBackdrop}><View style={styles.dialog}><Text style={styles.dialogTitle}>Add product</Text><Text style={styles.fieldLabel}>Product name</Text><TextInput autoFocus value={newProductName} onChangeText={setNewProductName} placeholder="e.g. Coconut milk" style={styles.dialogInput} /><Text style={styles.fieldLabel}>Category</Text><TextInput value={newProductCategory} onChangeText={setNewProductCategory} placeholder="e.g. Pantry" style={styles.dialogInput} /><Text style={styles.fieldLabel}>Price (PHP)</Text><TextInput value={newProductPrice} onChangeText={setNewProductPrice} placeholder="0.00" keyboardType="decimal-pad" style={styles.dialogInput} /><Text style={styles.fieldLabel}>Initial stock</Text><TextInput value={newProductStock} onChangeText={setNewProductStock} placeholder="0" keyboardType="number-pad" style={styles.dialogInput} /><View style={styles.dialogActions}><Pressable style={styles.secondaryButton} onPress={() => setProductDialogVisible(false)}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable><Pressable style={styles.primaryButton} onPress={() => void createProduct()}><Text style={styles.primaryButtonText}>Add product</Text></Pressable></View></View></View></Modal>
    <Modal visible={profileDialogVisible} transparent animationType="fade" onRequestClose={() => setProfileDialogVisible(false)}><View style={styles.modalBackdrop}><View style={styles.dialog}><Text style={styles.dialogTitle}>Edit profile</Text><Pressable style={styles.avatarPicker} onPress={chooseProfileAvatar}><View style={styles.avatarPreview}>{draftAvatarUri ? <Image source={{ uri: draftAvatarUri }} style={styles.avatarPreviewImage} /> : <Text style={styles.ownerInitials}>{draftOwnerName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</Text>}</View><Text style={styles.avatarPickerText}>{draftAvatarUri ? 'Change profile photo' : 'Add profile photo'}</Text></Pressable><Text style={styles.fieldLabel}>Store name</Text><TextInput value={draftStoreName} onChangeText={setDraftStoreName} placeholder="Store name" style={styles.dialogInput} /><Text style={styles.fieldLabel}>Owner name</Text><TextInput value={draftOwnerName} onChangeText={setDraftOwnerName} placeholder="Owner name" style={styles.dialogInput} /><View style={styles.dialogActions}><Pressable style={styles.secondaryButton} onPress={() => setProfileDialogVisible(false)}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable><Pressable style={styles.primaryButton} onPress={saveProfile}><Text style={styles.primaryButtonText}>Save profile</Text></Pressable></View></View></View></Modal>
  </View>;
}

function MetricTile({ label, value, context, compact = false }: { label: string; value: string; context: string; compact?: boolean }) {
  return <View style={[styles.metricTile, compact && styles.metricTileCompact]}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, compact && styles.metricValueCompact]}>{value}</Text><Text style={styles.metricContext}>{context}</Text></View>;
}
function QuickAction({ label, icon: Icon, tone, onPress }: { label: string; icon: LucideIcon; tone: 'orange' | 'mint'; onPress: () => void }) {
  return <Pressable style={[styles.quickAction, tone === 'orange' ? styles.quickActionOrange : styles.quickActionMint]} onPress={onPress}><Icon size={21} color={tone === 'orange' ? colors.ink : colors.tealDark} strokeWidth={2} /><Text style={[styles.quickActionLabel, tone === 'mint' && styles.quickActionLabelMint]}>{label}</Text></Pressable>;
}
function SupplierRow({ initials, name, delivery, order, amount, tone }: { initials: string; name: string; delivery: string; order: string; amount: string; tone: 'lavender' | 'peach' | 'mint' }) {
  return <Pressable style={styles.supplierRow}><View style={[styles.supplierAvatar, tone === 'peach' ? styles.supplierAvatarPeach : tone === 'mint' ? styles.supplierAvatarMint : null]}><Text style={styles.supplierInitials}>{initials}</Text></View><View style={styles.supplierInfo}><Text style={styles.productName}>{name}</Text><Text style={styles.productDetail}>{delivery}</Text><Text style={styles.supplierOrder}>{order}</Text></View><View style={styles.supplierAmount}><Text style={styles.supplierPrice}>{amount}</Text><ChevronIcon size={16} color={colors.muted} /></View></Pressable>;
}
function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.summaryRow}><Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text><Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text></View>;
}
function TopProduct({ name, detail, amount, rank }: { name: string; detail: string; amount: string; rank: string }) {
  return <View style={styles.topProductRow}><Text style={styles.productRank}>{rank}</Text><View style={styles.productInfo}><Text style={styles.productName}>{name}</Text><Text style={styles.productDetail}>{detail}</Text></View><Text style={styles.topProductAmount}>{amount}</Text></View>;
}
function SettingRow({ icon: Icon, title, detail, onPress }: { icon: LucideIcon; title: string; detail?: string; onPress: () => void }) {
  return <Pressable style={styles.settingRow} onPress={onPress}><View style={styles.settingIcon}><Icon size={18} color={colors.tealDark} /></View><View style={styles.settingTextGroup}><Text style={styles.settingTitle}>{title}</Text>{detail ? <Text style={styles.settingDetail}>{detail}</Text> : null}</View><ChevronIcon size={17} color={colors.muted} /></Pressable>;
}

const colors = { background: '#f8f1ff', paper: '#fffbff', ink: '#0f2d2a', muted: '#526e69', teal: '#1b998b', tealDark: '#087367', mint: '#e7f2ee', orange: '#ff9f1c', line: '#e8e1ec', pale: '#f2ecf7', danger: '#b54842' };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  appShell: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: colors.background },
  statusBar: { height: 32, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTime: { color: colors.ink, fontSize: 12, fontWeight: '700' }, statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  appBar: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  appTitle: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '600' }, headerBack: { width: 28, alignItems: 'flex-start', justifyContent: 'center' },
  headerAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' }, headerActionPlaceholder: { width: 40, height: 40 },
  notificationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange, position: 'absolute', top: 7, right: 7 }, pageBody: { flex: 1, minHeight: 0 },
  screenContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18, gap: 16 }, flexContent: { flex: 1, minHeight: 0 },
  greetingText: { gap: 4 }, greetingTitle: { color: colors.ink, fontSize: 21, fontWeight: '700', lineHeight: 25 }, greetingSub: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  salesCard: { backgroundColor: colors.teal, borderRadius: 20, padding: 16, gap: 8 }, cardLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  salesLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' }, salesAmount: { color: colors.ink, fontSize: 32, lineHeight: 37, fontWeight: '800' }, salesComparison: { color: colors.ink, fontSize: 12, fontWeight: '500' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, metricTile: { width: '48%', flexGrow: 1, flexBasis: '46%', minHeight: 101, padding: 12, borderRadius: 18, backgroundColor: colors.paper, gap: 4 },
  metricLabel: { color: colors.ink, fontSize: 12, fontWeight: '500' }, metricValue: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '800' }, metricContext: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  sectionBlock: { gap: 8 }, sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' }, quickActions: { flexDirection: 'row', gap: 8 },
  quickAction: { flex: 1, minWidth: 0, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 4 }, quickActionOrange: { backgroundColor: colors.orange }, quickActionMint: { backgroundColor: colors.mint },
  quickActionLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' }, quickActionLabelMint: { color: colors.tealDark }, restockCard: { padding: 8, borderRadius: 16, backgroundColor: colors.paper, gap: 4 },
  restockTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' }, viewAll: { color: colors.tealDark, fontSize: 12, fontWeight: '700' }, restockText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 4, height: 80 }, bottomNav: { height: 72, borderRadius: 40, backgroundColor: colors.paper, paddingHorizontal: 6, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 }, navIconWrap: { width: 48, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 18 }, navIconSelected: { backgroundColor: '#d8f0e9' },
  navLabel: { color: colors.muted, fontSize: 10, fontWeight: '500' }, navLabelSelected: { color: colors.tealDark, fontWeight: '700' }, gestureArea: { height: 16, alignItems: 'center', justifyContent: 'center' }, gestureHandle: { width: 104, height: 4, borderRadius: 4, backgroundColor: colors.ink },
  searchField: { height: 48, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', gap: 10 }, searchInput: { flex: 1, padding: 0, color: colors.ink, fontSize: 14 },
  chipRow: { flexDirection: 'row', gap: 8 }, categoryRow: { gap: 8, paddingRight: 16 }, filterChip: { minHeight: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.pale },
  filterChipSelected: { minHeight: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.tealDark }, filterText: { color: colors.muted, fontSize: 12, fontWeight: '600' }, filterTextSelected: { color: colors.paper, fontSize: 12, fontWeight: '700' },
  inventorySummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 64 }, stockTotal: { color: colors.ink, fontSize: 32, lineHeight: 37, fontWeight: '800' }, summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  addProductButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.tealDark }, listPanel: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 18, backgroundColor: colors.paper },
  productRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }, productIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#e7f2ee' }, productIconDrinks: { backgroundColor: '#e8edfa' },
  productInfo: { flex: 1, minWidth: 0, gap: 3 }, productName: { color: colors.ink, fontSize: 13, fontWeight: '700' }, productDetail: { color: colors.muted, fontSize: 11, fontWeight: '500' }, stockInfo: { minWidth: 36, alignItems: 'flex-end', gap: 0 },
  inventoryActions: { flexDirection: 'row', alignItems: 'center', gap: 3 }, inventoryIconButton: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.pale }, inventoryStockSymbol: { color: colors.tealDark, fontSize: 18, fontWeight: '700' }, disabledAction: { opacity: 0.4 }, emptyInventory: { color: colors.muted, textAlign: 'center', paddingVertical: 20, fontSize: 12 },
  stockNumber: { color: colors.ink, fontSize: 19, lineHeight: 22, fontWeight: '700' }, stockNumberLow: { color: colors.danger }, stockUnit: { color: colors.muted, fontSize: 10 }, lowTag: { paddingHorizontal: 5, borderRadius: 7, color: colors.danger, backgroundColor: '#fae8e5', overflow: 'hidden' },
  syncLabel: { color: colors.muted, fontSize: 11 }, saleSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '500', marginBottom: -6 }, saleListPanel: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 18, backgroundColor: colors.paper },
  saleAction: { alignItems: 'flex-end', gap: 4 }, salePrice: { color: colors.ink, fontSize: 14, fontWeight: '700' }, addButton: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  inlineQuantity: { flexDirection: 'row', alignItems: 'center', gap: 8 }, miniQuantityButton: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint }, miniQuantityText: { color: colors.tealDark, fontSize: 17, lineHeight: 20, fontWeight: '700' }, inlineQuantityValue: { minWidth: 13, textAlign: 'center', color: colors.ink, fontSize: 12, fontWeight: '700' },
  cartBar: { minHeight: 66, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.orange }, cartBarBadge: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center' },
  cartBarCount: { position: 'absolute', right: -3, top: -3, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: colors.paper, color: colors.ink, fontSize: 9, textAlign: 'center', overflow: 'hidden' }, cartBarInfo: { flex: 1 }, cartBarItems: { color: colors.ink, fontSize: 11, fontWeight: '600' }, cartBarTotal: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  cartBarAction: { flexDirection: 'row', alignItems: 'center', gap: 3 }, cartBarActionText: { color: colors.ink, fontSize: 12, fontWeight: '700' }, cartMeta: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  customerCard: { minHeight: 54, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, backgroundColor: colors.paper }, customerIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  customerName: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '600' }, changeLink: { color: colors.tealDark, fontSize: 12, fontWeight: '700' }, cartList: { paddingHorizontal: 8, borderRadius: 18, backgroundColor: colors.paper }, cartProduct: { minHeight: 87, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }, cartLineAmount: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  summaryPanel: { padding: 14, borderRadius: 18, backgroundColor: colors.paper, gap: 10 }, summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, summaryValue: { color: colors.ink, fontSize: 13, fontWeight: '600' }, discountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, addDiscount: { color: colors.tealDark, fontSize: 12, fontWeight: '700' }, totalDivider: { height: 1, backgroundColor: colors.line }, summaryStrong: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  primaryButton: { minHeight: 50, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: colors.tealDark }, primaryButtonText: { color: colors.paper, fontSize: 14, fontWeight: '700' }, buttonDisabled: { opacity: 0.45 }, footnote: { color: colors.muted, textAlign: 'center', fontSize: 11 },
  paymentTotalCard: { padding: 16, borderRadius: 20, backgroundColor: colors.teal, gap: 5 }, paymentAmount: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: '800' }, paymentMethods: { flexDirection: 'row', gap: 8 }, paymentMethod: { flex: 1, minHeight: 63, borderWidth: 1, borderColor: colors.line, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.paper }, paymentMethodSelected: { borderColor: colors.tealDark, backgroundColor: colors.mint }, paymentMethodText: { color: colors.muted, fontSize: 11, fontWeight: '600' }, paymentMethodTextSelected: { color: colors.tealDark, fontWeight: '700' }, fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  moneyInput: { height: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 14, color: colors.ink, backgroundColor: colors.paper, fontSize: 17, fontWeight: '700' }, changeCard: { padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.paper }, changeAmount: { color: colors.tealDark, fontSize: 22, fontWeight: '800', marginTop: 3 }, changeIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, cashHint: { color: colors.tealDark, fontSize: 11, fontWeight: '600' }, transactionPanel: { padding: 13, borderRadius: 15, backgroundColor: colors.paper, gap: 4 }, transactionId: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  receiptSuccess: { alignItems: 'center', paddingVertical: 8, gap: 5 }, receiptCheck: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#d8f0e9', alignItems: 'center', justifyContent: 'center' }, receiptHeading: { color: colors.ink, fontSize: 20, fontWeight: '800' }, receiptSub: { color: colors.muted, fontSize: 12 }, receiptPaper: { padding: 16, borderRadius: 18, backgroundColor: colors.paper, gap: 8 }, storeName: { color: colors.ink, textAlign: 'center', fontSize: 16, fontWeight: '800' }, receiptAddress: { color: colors.muted, textAlign: 'center', fontSize: 10 }, receiptDivider: { height: 1, backgroundColor: colors.line, marginVertical: 3 }, receiptMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 }, receiptMono: { color: colors.ink, fontSize: 11, fontWeight: '700' }, receiptDetail: { color: colors.muted, fontSize: 11 }, receiptItem: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 }, thankYou: { color: colors.tealDark, textAlign: 'center', fontSize: 12, fontWeight: '700', marginTop: 5 }, receiptActions: { flexDirection: 'row', gap: 9 }, secondaryButton: { flex: 1, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.tealDark, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, backgroundColor: colors.paper }, secondaryButtonText: { color: colors.tealDark, fontSize: 13, fontWeight: '700' },
  reportTabs: { minHeight: 40, padding: 3, borderRadius: 18, flexDirection: 'row', backgroundColor: colors.pale }, reportTab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 15 }, reportTabSelected: { backgroundColor: colors.paper }, reportTabText: { color: colors.muted, fontSize: 11, fontWeight: '600' }, reportTabTextSelected: { color: colors.tealDark, fontWeight: '700' }, reportSalesCard: { padding: 16, borderRadius: 20, backgroundColor: colors.teal, gap: 8 }, reportOverline: { color: colors.ink, fontSize: 12, fontWeight: '600' }, reportAmount: { color: colors.ink, fontSize: 32, fontWeight: '800' }, reportComparison: { color: colors.ink, fontSize: 11, fontWeight: '500' }, chartPanel: { padding: 14, borderRadius: 18, backgroundColor: colors.paper, gap: 10 }, chartUnit: { color: colors.muted, fontSize: 10 }, chart: { height: 125, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', gap: 8 }, chartColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }, chartTrack: { width: '100%', maxWidth: 22, minHeight: 12, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: '#bce2d8' }, chartTrackToday: { backgroundColor: colors.orange }, chartDay: { color: colors.muted, fontSize: 9 }, reportStats: { flexDirection: 'row', gap: 10 }, metricTileCompact: { flex: 1, minWidth: 0, minHeight: 96 }, metricValueCompact: { fontSize: 22, lineHeight: 29 }, topProductRow: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 10 }, productRank: { color: colors.tealDark, fontSize: 12, fontWeight: '800' }, topProductAmount: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  storeProfile: { alignItems: 'center', paddingVertical: 12, gap: 5 }, storeAvatar: { width: 64, height: 64, marginBottom: 4, borderRadius: 22, backgroundColor: '#d8f0e9', alignItems: 'center', justifyContent: 'center' }, storeProfileName: { color: colors.ink, fontSize: 19, fontWeight: '800' }, locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, locationText: { color: colors.muted, fontSize: 12 }, storeStatus: { color: colors.tealDark, fontSize: 11, fontWeight: '600' }, ownerCard: { minHeight: 68, padding: 12, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.paper }, ownerAvatar: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5e2d0', overflow: 'hidden' }, ownerAvatarImage: { width: 42, height: 42 }, ownerInitials: { color: colors.ink, fontSize: 13, fontWeight: '800' }, ownerInfo: { flex: 1, gap: 3 }, ownerName: { color: colors.ink, fontSize: 13, fontWeight: '700' }, ownerRole: { color: colors.muted, fontSize: 11 }, editProfileLabel: { color: colors.tealDark, fontSize: 12, fontWeight: '700' }, avatarPicker: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 }, avatarPreview: { width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5e2d0', overflow: 'hidden' }, avatarPreviewImage: { width: 76, height: 76 }, avatarPickerText: { color: colors.tealDark, fontSize: 12, fontWeight: '700' }, settingsHeading: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: -8 }, settingsPanel: { paddingHorizontal: 12, borderRadius: 17, backgroundColor: colors.paper }, settingRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, settingIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint }, settingTextGroup: { flex: 1, gap: 2 }, settingTitle: { color: colors.ink, fontSize: 12, fontWeight: '600' }, settingDetail: { color: colors.muted, fontSize: 10 }, signOutButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#fae8e5' }, signOutText: { color: colors.danger, fontSize: 13, fontWeight: '700' }, appVersion: { color: colors.muted, textAlign: 'center', fontSize: 10 },
  supplierCount: { color: colors.muted, fontSize: 11 }, supplierRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, supplierAvatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9e1f3' }, supplierAvatarPeach: { backgroundColor: '#f5e2d0' }, supplierAvatarMint: { backgroundColor: colors.mint }, supplierInitials: { color: colors.tealDark, fontSize: 13, fontWeight: '800' }, supplierInfo: { flex: 1, gap: 3 }, supplierOrder: { color: colors.ink, fontSize: 10, fontWeight: '600' }, supplierAmount: { alignItems: 'flex-end', gap: 5 }, supplierPrice: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 100, minHeight: 46, paddingHorizontal: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.ink, elevation: 5 }, toastText: { color: colors.paper, fontSize: 12, fontWeight: '600' }, toastDismiss: { color: colors.paper, fontSize: 21, paddingLeft: 12 },
  modalBackdrop: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: 'rgba(15,45,42,0.42)' }, dialog: { padding: 18, borderRadius: 20, backgroundColor: colors.paper, gap: 12 }, dialogTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' }, dialogInput: { height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, color: colors.ink }, dialogActions: { flexDirection: 'row', gap: 9, marginTop: 4 },
});