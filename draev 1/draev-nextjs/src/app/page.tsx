import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Story from "@/components/Story";
import CustomOrdersSection from "@/components/CustomOrdersSection";
import Footer from "@/components/Footer";
import QuickViewModal from "@/components/QuickViewModal";
import CartDrawer from "@/components/CartDrawer";
import CheckoutModal from "@/components/CheckoutModal";
import ConfirmModal from "@/components/ConfirmModal";
import InfoModal from "@/components/InfoModal";
import CustomOrderModal from "@/components/CustomOrderModal";
import Toast from "@/components/Toast";

export default function Home() {
  return (
    <>
      <Header />

      <main id="top" className="pt-[96px]">
        <Hero />
        <ProductGrid />
        <Story />
        <CustomOrdersSection />
      </main>

      <Footer />

      <QuickViewModal />
      <CartDrawer />
      <CheckoutModal />
      <ConfirmModal />
      <InfoModal />
      <CustomOrderModal />
      <Toast />
    </>
  );
}
