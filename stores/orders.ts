import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Order {
  id: string;
  serviceId: string;
  serviceTitle: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  total: number;
  currency: string;
  paymentMethod: "yape" | "plin" | "mercado_pago" | "bank";
  transactionId?: string;
  createdAt: string;
  scheduledDate?: string;
  scheduledTime?: string;
  address: string;
  description?: string;
  notes?: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  bookingDetails?: {
    date: string;
    time: string;
    quantity: number;
  };
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;

  // Actions
  addOrder: (order: Omit<Order, "id" | "createdAt">) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: Order["status"]) => Order[];
  clearOrders: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOrders: (orders: Order[]) => void;

  // Booking flow helpers
  createBookingFromService: (
    serviceId: string,
    serviceTitle: string,
    providerName: string,
    providerId: string,
    bookingData: {
      date: string;
      time: string;
      address: string;
      notes?: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      quantity: number;
      totalPrice: number;
      paymentMethod: "yape" | "plin" | "mercado_pago" | "bank";
      transactionId?: string;
    },
  ) => string;
}

const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `order_${timestamp}_${random}`;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      loading: false,
      error: null,

      addOrder: (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: generateOrderId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          error: null,
        }));

        return newOrder.id;
      },

      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id ? { ...order, ...updates } : order,
          ),
          error: null,
        }));
      },

      removeOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== id),
          error: null,
        }));
      },

      getOrderById: (id) => {
        const { orders } = get();
        return orders.find((order) => order.id === id);
      },

      getOrdersByStatus: (status) => {
        const { orders } = get();
        return orders.filter((order) => order.status === status);
      },

      clearOrders: () => {
        set({ orders: [], error: null });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      setOrders: (orders) => {
        set({ orders, error: null });
      },

      createBookingFromService: (
        serviceId,
        serviceTitle,
        providerName,
        providerId,
        bookingData,
      ) => {
        const orderId = generateOrderId();
        const now = new Date();

        const newOrder: Order = {
          id: orderId,
          serviceId,
          serviceTitle,
          serviceName: serviceTitle,
          providerName,
          providerId,
          status:
            bookingData.paymentMethod === "mercado_pago" &&
            bookingData.transactionId
              ? "confirmed"
              : "pending",
          total: bookingData.totalPrice,
          currency: "USD",
          paymentMethod: bookingData.paymentMethod,
          transactionId: bookingData.transactionId,
          createdAt: now.toISOString(),
          // Fecha y hora se generan automáticamente
          scheduledDate: now.toISOString().split('T')[0], // YYYY-MM-DD
          scheduledTime: now.toTimeString().slice(0, 5), // HH:MM
          address: bookingData.address,
          notes: bookingData.notes,
          contactInfo: {
            name: bookingData.contactName,
            phone: bookingData.contactPhone,
            email: bookingData.contactEmail,
          },
          bookingDetails: {
            date: now.toISOString().split('T')[0], // YYYY-MM-DD
            time: now.toTimeString().slice(0, 5), // HH:MM
            quantity: bookingData.quantity,
          },
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          error: null,
        }));

        return orderId;
      },
    }),
    {
      name: "orders-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

// Selectors for easier access
export const useOrders = () => useOrdersStore((state) => state.orders);
export const useOrdersLoading = () => useOrdersStore((state) => state.loading);
export const useOrdersError = () => useOrdersStore((state) => state.error);

// Helper hooks
export const usePendingOrders = () =>
  useOrdersStore((state) =>
    state.orders.filter((order) => order.status === "pending"),
  );

export const useCompletedOrders = () =>
  useOrdersStore((state) =>
    state.orders.filter((order) => order.status === "completed"),
  );

export const useOrdersCount = () =>
  useOrdersStore((state) => state.orders.length);

export const useRecentOrders = (limit: number = 5) =>
  useOrdersStore((state) =>
    state.orders
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit),
  );
