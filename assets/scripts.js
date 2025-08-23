// Payment Methods Configuration
const paymentMethodsConfig = {
  // Currency-specific payment methods
  gbp: ["iban", "zen"],
  eur: ["iban", "zen"],
  pln: ["iban", "blik", "zen"],
  brl: ["pix", "pse", "iban", "zen"],
  mxn: ["spei", "iban", "zen"],
  cop: ["pse", "iban", "zen"],
};

// Crypto Exchange Widget Module
const CryptoExchange = (() => {
  // Configuration constants
  const CONFIG = {
    FIAT_CURRENCIES: ["gbp", "eur", "pln", "brl", "mxn", "cop"],
    CRYPTO_ASSETS: ["usdc", "usdt", "eth", "eurc"],
    CRYPTO_GECKO_IDS: {
      usdc: "usd-coin",
      usdt: "tether",
      eth: "ethereum",
      eurc: "euro-coin",
    },
    FIAT_GECKO_MAP: {
      gbp: "gbp",
      eur: "eur",
      pln: "pln",
      brl: "brl",
      mxn: "mxn",
      cop: "cop",
    },
    FEE_STRUCTURE: {
      low: {
        buy: { spread: 5.0, fixed: 1.5 },
        sell: { spread: 2.5, fixed: 1.0 },
      },
      medium: {
        buy: { spread: 3.0, fixed: 1.0 },
        sell: { spread: 1.9, fixed: 0.8 },
      },
      normal: {
        buy: { spread: 2.7, fixed: 0 },
        sell: { spread: 1.7, fixed: 0 },
      },
    },
    USD_THRESHOLDS: { LOW: 100, MEDIUM: 500 },
    QUOTE_EXPIRY: 30, // seconds
    CURRENCY_SYMBOLS: {
      gbp: "£",
      eur: "€",
      pln: "zł",
      brl: "R$",
      mxn: "$",
      cop: "$",
    },
    CRYPTO_NAMES: {
      usdc: "USDC",
      usdt: "USDT",
      eth: "ETH",
      eurc: "EURC",
    },
    FIAT_TO_USD: {
      gbp: 1.25,
      eur: 1.08,
      pln: 0.25,
      brl: 0.2,
      mxn: 0.06,
      cop: 0.00025,
    },
  };

  // State management
  const state = {
    transactionType: "buy",
    currentFiat: "eur",
    currentCrypto: "usdc",
    currentNetwork: "ethereum",
    currentPaymentMethod: "iban",
    quoteExpiry: CONFIG.QUOTE_EXPIRY,
    expiryTimer: null,
    swapFromCrypto: "usdc",
    swapToCrypto: "usdt",
    swapNetwork: "ethereum",
    liveRates: null,
    swapQuoteExpiry: CONFIG.QUOTE_EXPIRY,
    swapExpiryTimer: null,
    calculationMode: "send",
    swapCalculationMode: "send",
    profileActive: false,
    showBuySellAdditionalFields: false,
    showSwapAdditionalFields: false,
  };

  // DOM references
  const DOM = {
    // Exchange elements
    fiatSelect: document.getElementById("fiatCurrencySelect"),
    cryptoSelect: document.getElementById("cryptoAssetSelect"),
    networkSelect: document.getElementById("networkSelect"),
    paymentMethodSelect: document.getElementById("paymentMethodSelect"),
    walletAddress: document.getElementById("walletAddress"),
    sendAmount: document.getElementById("sendAmount"),
    receiveAmount: document.getElementById("receiveAmount"),
    finalRateEl: document.getElementById("finalRate"),
    expiryTimerEl: document.getElementById("expiryTimer"),
    confirmButton: document.getElementById("confirmButton"),
    actionButton: document.getElementById("actionButton"),
    sendSymbol: document.getElementById("sendSymbol"),
    receiveSymbol: document.getElementById("receiveSymbol"),
    swapButton: document.getElementById("swapButton"),
    termsCheckbox: document.getElementById("termsCheckbox"),
    termsError: document.getElementById("termsError"),
    verificationScreen: document.querySelector(".verification-screen"),
    verifyButton: document.getElementById("verifyButton"),
    buySellSection: document.getElementById("buySellSection"),
    swapSection: document.getElementById("swapSection"),
    swapFromAsset: document.getElementById("swapFromAssetSelect"),
    swapToAsset: document.getElementById("swapToAssetSelect"),
    swapNetworkSelect: document.getElementById("swapNetworkSelect"),
    swapWalletAddress: document.getElementById("swapWalletAddress"),
    swapAmount: document.getElementById("swapAmount"),
    swapReceiveAmount: document.getElementById("swapReceiveAmount"),
    swapFinalRateEl: document.getElementById("swapFinalRate"),
    swapExpiryTimerEl: document.getElementById("swapExpiryTimer"),
    toggleMode: document.getElementById("toggleMode"),
    swapToggleMode: document.getElementById("swapToggleMode"),
    buySellAdditionalFields: document.getElementById("buySellAdditionalFields"),
    swapAdditionalFields: document.getElementById("swapAdditionalFields"),

    // Profile elements
    profileIcon: document.getElementById("profileIcon"),
    profileSection: document.getElementById("profileSection"),
    exchangeWidget: document.getElementById("exchangeWidget"),
    profileBackButton: document.getElementById("profileBackButton"),
    profileTabs: document.querySelectorAll(".profile-tab"),
    tabContents: document.querySelectorAll(".tab-content"),
    logoutButton: document.getElementById("logoutButton"),
    logoutModal: document.getElementById("logoutModal"),
    cancelLogout: document.getElementById("cancelLogout"),
    confirmLogout: document.getElementById("confirmLogout"),
    resetPassword: document.getElementById("resetPassword"),
    changeEmail: document.getElementById("changeEmail"),
    userName: document.getElementById("userName"),

    // Error messages
    networkError: document.getElementById("networkError"),
    paymentMethodError: document.getElementById("paymentMethodError"),
    walletAddressError: document.getElementById("walletAddressError"),
    sendAmountError: document.getElementById("sendAmountError"),
    receiveAmountError: document.getElementById("receiveAmountError"),
    swapNetworkError: document.getElementById("swapNetworkError"),
    swapWalletAddressError: document.getElementById("swapWalletAddressError"),
    swapAmountError: document.getElementById("swapAmountError"),
    swapReceiveAmountError: document.getElementById("swapReceiveAmountError"),
    swapFromAssetError: document.getElementById("swapFromAssetError"),
    swapToAssetError: document.getElementById("swapToAssetError"),
  };

  // Initialize the widget
  function init() {
    setupEventListeners();
    utils();
    initCustomSelects();
    updateUI();
    calculatePrice();
    populateUserData();
    updateAdditionalFields();
  }

  function utils() {
    const closeModel = document.getElementById("closeModel");
    closeModel.addEventListener("click", () => {
      const content = document.querySelector(".profile-content");
      content.classList.remove("open");
      document.querySelector(".profile-overlay-backdrop").style.display =
        "none";
    });
  }

  // Initialize custom select components
  function initCustomSelects() {
    // Add click handlers to all custom selects
    document.querySelectorAll(".custom-select").forEach((select) => {
      const header = select.querySelector(".select-header");
      const options = select.querySelector(".select-options");
      document.querySelector(".overlay-backdrop").style.display = "none";

      header.addEventListener("click", () => {
        const isOpen = select.classList.contains("open");
        document.querySelectorAll(".custom-select").forEach((s) => {
          s.classList.remove("open");
        });

        if (!isOpen) {
          select.classList.add("open");

          document.querySelector(".overlay-backdrop").style.display = "block";
        }
      });

      // Add click handlers to options
      options.querySelectorAll(".select-option").forEach((option) => {
        option.addEventListener("click", () => {
          document.querySelector(".overlay-backdrop").style.display = "none";
          // Remove active class from all options
          options.querySelectorAll(".select-option").forEach((opt) => {
            opt.classList.remove("active");
          });

          // Add active class to selected option
          option.classList.add("active");

          // Update header text
          const headerText = option.textContent.trim();
          let iconElement = option.querySelector("img, i");
          if (iconElement) {
            iconElement = iconElement.cloneNode(true);
          }

          header.innerHTML = "";
          const span = document.createElement("span");
          if (iconElement) {
            span.appendChild(iconElement);
          }
          span.appendChild(document.createTextNode(" " + headerText));
          header.appendChild(span);
          header.appendChild(document.createElement("i")).className =
            "fas fa-chevron-down";

          // Update state based on which select was changed
          if (select === DOM.fiatSelect) {
            state.currentFiat = option.dataset.value;
            updatePaymentMethods();
            updateUI();
            calculatePrice();
            updateAdditionalFields();
          } else if (select === DOM.cryptoSelect) {
            state.currentCrypto = option.dataset.value;
            updateUI();
            calculatePrice();
            updateAdditionalFields();
          } else if (select === DOM.networkSelect) {
            state.currentNetwork = option.dataset.value;
          } else if (select === DOM.paymentMethodSelect) {
            state.currentPaymentMethod = option.dataset.value;
          } else if (select === DOM.swapFromAsset) {
            state.swapFromCrypto = option.dataset.value;
            updateSwapUI();
            calculateSwapPrice();
            updateAdditionalFields();
          } else if (select === DOM.swapToAsset) {
            state.swapToCrypto = option.dataset.value;
            updateSwapUI();
            calculateSwapPrice();
            updateAdditionalFields();
          } else if (select === DOM.swapNetworkSelect) {
            state.swapNetwork = option.dataset.value;
          }

          // Close the dropdown
          select.classList.remove("open");
          document.querySelector(".overlay-backdrop").style.display = "none";
        });
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-select")) {
        document.querySelectorAll(".custom-select").forEach((select) => {
          select.classList.remove("open");

          document.querySelector(".overlay-backdrop").style.display = "none";
        });
      }
    });
  }

  // Update payment methods based on selected currency
  function updatePaymentMethods() {
    const currency = state.currentFiat;
    const methods = paymentMethodsConfig[currency];

    // Hide all payment methods
    DOM.paymentMethodSelect
      .querySelectorAll(".select-option")
      .forEach((option) => {
        option.style.display = "none";
      });

    // Show only the relevant methods
    methods.forEach((method) => {
      const option = DOM.paymentMethodSelect.querySelector(
        `.select-option[data-value="${method}"]`
      );
      if (option) {
        option.style.display = "flex";
      }
    });

    // Reset to first available method if current is not available
    if (!methods.includes(state.currentPaymentMethod)) {
      state.currentPaymentMethod = methods[0];
      const firstOption = DOM.paymentMethodSelect.querySelector(
        `.select-option[data-value="${methods[0]}"]`
      );
      if (firstOption) {
        firstOption.click();
      }
    }
  }

  // Populate user data from the userData object
  function populateUserData() {
    DOM.userName.textContent = "John Smith";
  }

  // Set up all event listeners
  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", handleTabClick);
    });

    // Input handling
    DOM.sendAmount.addEventListener("input", () => {
      handleInputChange("send");
      updateAdditionalFields();
    });

    DOM.receiveAmount.addEventListener("input", () => {
      handleInputChange("receive");
      updateAdditionalFields();
    });

    DOM.swapAmount.addEventListener("input", () => {
      handleSwapInputChange("send");
      updateAdditionalFields();
    });

    DOM.swapReceiveAmount.addEventListener("input", () => {
      handleSwapInputChange("receive");
      updateAdditionalFields();
    });

    DOM.confirmButton.addEventListener("click", () => {
      DOM.buySellAdditionalFields.classList.remove("show");
      document.querySelector(".network-overlay-backdrop").style.display =
        "none";
    });

    // Calculation mode toggles
    DOM.toggleMode.addEventListener("click", toggleCalculationMode);
    DOM.swapToggleMode.addEventListener("click", toggleSwapCalculationMode);

    // Swap button
    DOM.swapButton.addEventListener("click", handleSwapButtonClick);

    // Terms and verification
    DOM.termsCheckbox.addEventListener("change", handleTermsChange);
    DOM.actionButton.addEventListener("click", handleActionButtonClick);
    DOM.verifyButton.addEventListener("click", handleVerifyButtonClick);

    // Profile management
    DOM.profileIcon.addEventListener("click", toggleProfile);
    DOM.profileBackButton.addEventListener("click", toggleProfile);

    // Profile tabs
    DOM.profileTabs.forEach((tab) => {
      tab.addEventListener("click", handleProfileTabClick);
    });

    // Logout functionality
    DOM.logoutButton.addEventListener("click", () => {
      DOM.logoutModal.style.display = "flex";
    });

    DOM.cancelLogout.addEventListener("click", () => {
      DOM.logoutModal.style.display = "none";
    });

    DOM.confirmLogout.addEventListener("click", () => {
      // This would be replaced with actual logout functionality
      alert("You have been logged out");
      DOM.logoutModal.style.display = "none";
    });

    // Security actions
    DOM.resetPassword.addEventListener("click", () => {
      alert("Password reset functionality would be implemented here");
    });

    DOM.changeEmail.addEventListener("click", () => {
      alert("Email change functionality would be implemented here");
    });

    // Wallet address validation
    DOM.walletAddress.addEventListener("input", validateWalletAddress);
    DOM.swapWalletAddress.addEventListener("input", validateSwapWalletAddress);
  }

  // Toggle profile view
  function toggleProfile() {
    state.profileActive = !state.profileActive;
    if (state.profileActive) {
      DOM.exchangeWidget.style.display = "none";
      DOM.profileSection.style.display = "block";
    } else {
      DOM.exchangeWidget.style.display = "block";
      DOM.profileSection.style.display = "none";
    }
  }

  // Handle profile tab clicks
  function handleProfileTabClick(event) {
    const tab = event.currentTarget;
    const tabId = tab.dataset.tab;

    // Remove active class from all tabs
    DOM.profileTabs.forEach((t) => t.classList.remove("active"));

    // Add active class to clicked tab
    tab.classList.add("active");

    // Hide all tab contents
    DOM.tabContents.forEach((content) => content.classList.remove("active"));

    // Show selected tab content
    document.getElementById(`${tabId}Content`).classList.add("active");
    const content = document.querySelector(".profile-content");
    const isOpen = content.classList.contains("open");

    content.classList.remove("open");
    document.querySelector(".profile-overlay-backdrop").style.display = "none";

    if (!isOpen) {
      content.classList.add("open");
      document.querySelector(".profile-overlay-backdrop").style.display =
        "block";
    }
  }

  // Event handlers
  function handleTabClick(event) {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    event.target.classList.add("active");
    state.transactionType = event.target.dataset.type;
    updateUI();
    calculatePrice();
    updateAdditionalFields();
  }

  function handleInputChange(mode) {
    state.calculationMode = mode;
    calculatePrice();
  }

  function handleSwapInputChange(mode) {
    state.swapCalculationMode = mode;
    calculateSwapPrice();
  }

  function toggleCalculationMode() {
    state.calculationMode =
      state.calculationMode === "send" ? "receive" : "send";
    updateCalculationModeUI();
    calculatePrice();
  }

  function toggleSwapCalculationMode() {
    state.swapCalculationMode =
      state.swapCalculationMode === "send" ? "receive" : "send";
    updateSwapCalculationModeUI();
    calculateSwapPrice();
  }

  function handleSwapButtonClick() {
    if (state.transactionType === "swap") {
      // Swap the two crypto assets
      [state.swapFromCrypto, state.swapToCrypto] = [
        state.swapToCrypto,
        state.swapFromCrypto,
      ];
      updateSwapUI();
      calculateSwapPrice();
    } else {
      swapInputGroups();
    }
  }

  function handleTermsChange() {
    DOM.termsError.style.display = "none";
  }

  function validateWalletAddress() {
    if (DOM.walletAddress.value.trim() === "") {
      DOM.walletAddressError.style.display = "block";
      DOM.buySellAdditionalFields.classList.add("show");
      document.querySelector(".network-overlay-backdrop").style.display =
        "block";
    } else {
      DOM.walletAddressError.style.display = "none";
    }
  }

  function validateSwapWalletAddress() {
    if (DOM.swapWalletAddress.value.trim() === "") {
      DOM.swapWalletAddressError.style.display = "block";
    } else {
      DOM.swapWalletAddressError.style.display = "none";
    }
  }

  function handleActionButtonClick() {
    let isValid = true;

    // Validate all required fields
    if (!DOM.termsCheckbox.checked) {
      DOM.termsError.style.display = "block";
      isValid = false;
    }

    if (state.transactionType === "buy" || state.transactionType === "sell") {
      if (
        DOM.sendAmount.value === "" ||
        parseFloat(DOM.sendAmount.value) <= 0
      ) {
        DOM.sendAmountError.style.display = "block";
        isValid = false;
      }

      if (
        DOM.receiveAmount.value === "" ||
        parseFloat(DOM.receiveAmount.value) <= 0
      ) {
        DOM.receiveAmountError.style.display = "block";
        isValid = false;
      }

      if (DOM.walletAddress.value.trim() === "") {
        DOM.walletAddressError.style.display = "block";
        DOM.buySellAdditionalFields.classList.add("show");
        document.querySelector(".network-overlay-backdrop").style.display =
          "block";
        isValid = false;
      }
    } else {
      if (
        DOM.swapAmount.value === "" ||
        parseFloat(DOM.swapAmount.value) <= 0
      ) {
        DOM.swapAmountError.style.display = "block";
        isValid = false;
      }

      if (
        DOM.swapReceiveAmount.value === "" ||
        parseFloat(DOM.swapReceiveAmount.value) <= 0
      ) {
        DOM.swapReceiveAmountError.style.display = "block";
        isValid = false;
      }

      if (DOM.swapWalletAddress.value.trim() === "") {
        DOM.swapWalletAddressError.style.display = "block";
        isValid = false;
      }
    }

    if (!isValid) return;

    DOM.verificationScreen.style.display = "flex";
  }

  function handleVerifyButtonClick() {
    window.location.href =
      "https://in.sumsub.com/websdk/p/uni_L1MlISScJCZcqFLb";
  }

  // Swap "You send" and "You receive" inputs
  function swapInputGroups() {
    if (state.transactionType !== "buy" && state.transactionType !== "sell")
      return;

    // Swap input values
    [DOM.sendAmount.value, DOM.receiveAmount.value] = [
      DOM.receiveAmount.value,
      DOM.sendAmount.value,
    ];

    // Toggle calculation mode
    state.calculationMode =
      state.calculationMode === "send" ? "receive" : "send";
    updateCalculationModeUI();

    calculatePrice();
  }

  // Update UI based on state
  function updateUI() {
    // Show/hide sections based on transaction type
    if (state.transactionType === "buy" || state.transactionType === "sell") {
      DOM.buySellSection.style.display = "block";
      DOM.swapSection.style.display = "none";

      if (state.transactionType === "buy") {
        DOM.sendSymbol.textContent = CONFIG.CURRENCY_SYMBOLS[state.currentFiat];
        DOM.receiveSymbol.textContent =
          CONFIG.CRYPTO_NAMES[state.currentCrypto];
        DOM.actionButton.textContent = `Buy ${
          CONFIG.CRYPTO_NAMES[state.currentCrypto]
        }`;
      } else {
        DOM.sendSymbol.textContent = CONFIG.CRYPTO_NAMES[state.currentCrypto];
        DOM.receiveSymbol.textContent =
          CONFIG.CURRENCY_SYMBOLS[state.currentFiat];
        DOM.actionButton.textContent = `Sell ${
          CONFIG.CRYPTO_NAMES[state.currentCrypto]
        }`;
      }
    } else {
      DOM.buySellSection.style.display = "none";
      DOM.swapSection.style.display = "block";
      updateSwapUI();
    }

    updateCalculationModeUI();
  }

  function updateSwapUI() {
    DOM.swapFromSymbol.textContent = CONFIG.CRYPTO_NAMES[state.swapFromCrypto];
    DOM.swapToSymbol.textContent = CONFIG.CRYPTO_NAMES[state.swapToCrypto];
    DOM.actionButton.textContent = `Swap to ${
      CONFIG.CRYPTO_NAMES[state.swapToCrypto]
    }`;
    updateSwapCalculationModeUI();
  }

  function updateCalculationModeUI() {
    DOM.toggleMode.textContent =
      state.calculationMode === "send"
        ? "Calculate from receive amount"
        : "Calculate from send amount";
  }

  function updateSwapCalculationModeUI() {
    DOM.swapToggleMode.textContent =
      state.swapCalculationMode === "send"
        ? "Calculate from receive amount"
        : "Calculate from send amount";
  }

  // Fetch live rates from CoinGecko
  async function fetchLiveRates() {
    try {
      const cryptoIds = Object.values(CONFIG.CRYPTO_GECKO_IDS).join(",");
      const vsCurrencies = [
        ...Object.values(CONFIG.FIAT_GECKO_MAP),
        "usd",
      ].join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=${vsCurrencies}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch live rates:", error);
      return null;
    }
  }

  // Calculate prices with live rates for buy/sell
  async function calculatePrice() {
    try {
      const amount =
        parseFloat(
          state.calculationMode === "send"
            ? DOM.sendAmount.value
            : DOM.receiveAmount.value
        ) || 0;

      // Fetch rates if needed
      if (!state.liveRates) {
        state.liveRates = await fetchLiveRates();
        if (!state.liveRates) {
          handleRateError();
          return;
        }
      }

      const cryptoId = CONFIG.CRYPTO_GECKO_IDS[state.currentCrypto];
      const fiatCode = CONFIG.FIAT_GECKO_MAP[state.currentFiat];

      if (
        !state.liveRates[cryptoId] ||
        state.liveRates[cryptoId][fiatCode] === undefined
      ) {
        throw new Error("Rate not available for selected pair");
      }

      const marketPrice = state.liveRates[cryptoId][fiatCode];
      const usdEquivalent = calculateUsdEquivalent(amount, cryptoId);
      const feeTier = determineFeeTier(usdEquivalent);
      const fees = CONFIG.FEE_STRUCTURE[feeTier][state.transactionType];
      const fixedFeeInFiat = fees.fixed / CONFIG.FIAT_TO_USD[state.currentFiat];

      // Calculate final price and values
      const { finalPrice, sendValue, receiveValue } = calculateFinalValues(
        amount,
        marketPrice,
        fees,
        fixedFeeInFiat
      );

      // Update UI
      updatePriceUI(finalPrice, sendValue, receiveValue);
      resetExpiryTimer();
    } catch (error) {
      console.error("Error calculating price:", error);
      handleRateError();
    }
  }

  // Helper functions for price calculation
  function calculateUsdEquivalent(amount, cryptoId) {
    if (state.transactionType === "buy") {
      return state.calculationMode === "send"
        ? amount * CONFIG.FIAT_TO_USD[state.currentFiat]
        : amount * state.liveRates[cryptoId].usd;
    } else {
      return state.calculationMode === "send"
        ? amount * state.liveRates[cryptoId].usd
        : amount * CONFIG.FIAT_TO_USD[state.currentFiat];
    }
  }

  function determineFeeTier(usdEquivalent) {
    if (usdEquivalent < CONFIG.USD_THRESHOLDS.LOW) return "low";
    if (usdEquivalent < CONFIG.USD_THRESHOLDS.MEDIUM) return "medium";
    return "normal";
  }

  function calculateFinalValues(amount, marketPrice, fees, fixedFee) {
    let finalPrice, sendValue, receiveValue;

    if (state.transactionType === "buy") {
      finalPrice = marketPrice * (1 + fees.spread / 100);

      if (state.calculationMode === "send") {
        receiveValue = Math.max((amount - fixedFee) / finalPrice, 0);
        DOM.receiveAmount.value = receiveValue.toFixed(3);
      } else {
        sendValue = amount * finalPrice + fixedFee;
        DOM.sendAmount.value = sendValue.toFixed(2);
      }
    } else {
      finalPrice = marketPrice * (1 - fees.spread / 100);

      if (state.calculationMode === "send") {
        receiveValue = Math.max(amount * finalPrice - fixedFee, 0);
        DOM.receiveAmount.value = receiveValue.toFixed(2);
      } else {
        sendValue = (amount + fixedFee) / finalPrice;
        DOM.sendAmount.value = sendValue.toFixed(3);
      }
    }

    return { finalPrice, sendValue, receiveValue };
  }

  function updatePriceUI(finalPrice, sendValue, receiveValue) {
    DOM.finalRateEl.textContent = `1 ${
      CONFIG.CRYPTO_NAMES[state.currentCrypto]
    } = ${formatCurrency(finalPrice, state.currentFiat)}`;
  }

  function handleRateError() {
    DOM.finalRateEl.textContent = "Price data unavailable";
    DOM.receiveAmount.value = "";
    DOM.sendAmount.value = "";
  }

  // Calculate swap prices
  async function calculateSwapPrice() {
    try {
      const amount =
        parseFloat(
          state.swapCalculationMode === "send"
            ? DOM.swapAmount.value
            : DOM.swapReceiveAmount.value
        ) || 0;

      // Fetch rates if needed
      if (!state.liveRates) {
        state.liveRates = await fetchLiveRates();
        if (!state.liveRates) {
          handleSwapRateError();
          return;
        }
      }

      const fromCryptoId = CONFIG.CRYPTO_GECKO_IDS[state.swapFromCrypto];
      const toCryptoId = CONFIG.CRYPTO_GECKO_IDS[state.swapToCrypto];

      if (
        !state.liveRates[fromCryptoId] ||
        !state.liveRates[toCryptoId] ||
        state.liveRates[fromCryptoId].usd === undefined ||
        state.liveRates[toCryptoId].usd === undefined
      ) {
        throw new Error("Rates not available for crypto pair");
      }

      const fromPriceUSD = state.liveRates[fromCryptoId].usd;
      const toPriceUSD = state.liveRates[toCryptoId].usd;
      const marketPrice = fromPriceUSD / toPriceUSD;
      const finalPrice = marketPrice * 0.995; // 0.5% spread

      let fromValue, toValue;

      if (state.swapCalculationMode === "send") {
        toValue = Math.max(amount * finalPrice, 0);
        DOM.swapReceiveAmount.value = toValue.toFixed(3);
      } else {
        fromValue = amount / finalPrice;
        DOM.swapAmount.value = fromValue.toFixed(3);
      }

      DOM.swapFinalRateEl.textContent = `1 ${
        CONFIG.CRYPTO_NAMES[state.swapFromCrypto]
      } = ${finalPrice.toFixed(3)} ${CONFIG.CRYPTO_NAMES[state.swapToCrypto]}`;

      resetSwapExpiryTimer();
    } catch (error) {
      console.error("Error calculating swap price:", error);
      handleSwapRateError();
    }
  }

  function handleSwapRateError() {
    DOM.swapFinalRateEl.textContent = "Price unavailable";
    DOM.swapReceiveAmount.value = "";
    DOM.swapAmount.value = "";
  }

  // Format currency display
  function formatCurrency(value, currency) {
    if (currency === "usd") return "$" + value.toFixed(3);
    return CONFIG.CURRENCY_SYMBOLS[currency] + value.toFixed(3);
  }

  // Quote expiry timers
  function resetExpiryTimer() {
    clearInterval(state.expiryTimer);
    state.quoteExpiry = CONFIG.QUOTE_EXPIRY;
    updateTimerDisplay();

    state.expiryTimer = setInterval(() => {
      state.quoteExpiry--;
      updateTimerDisplay();

      if (state.quoteExpiry <= 0) {
        clearInterval(state.expiryTimer);
        state.liveRates = null;
        calculatePrice();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    DOM.expiryTimerEl.textContent = `${state.quoteExpiry}s`;
  }

  function resetSwapExpiryTimer() {
    clearInterval(state.swapExpiryTimer);
    state.swapQuoteExpiry = CONFIG.QUOTE_EXPIRY;
    updateSwapTimerDisplay();

    state.swapExpiryTimer = setInterval(() => {
      state.swapQuoteExpiry--;
      updateSwapTimerDisplay();

      if (state.swapQuoteExpiry <= 0) {
        clearInterval(state.swapExpiryTimer);
        state.liveRates = null;
        calculateSwapPrice();
      }
    }, 1000);
  }

  function updateSwapTimerDisplay() {
    DOM.swapExpiryTimerEl.textContent = `${state.swapQuoteExpiry}s`;
  }

  // Check conditions for showing additional fields
  function checkBuySellConditions() {
    return (
      state.currentFiat &&
      state.currentCrypto &&
      (parseFloat(DOM.sendAmount.value) > 0 ||
        parseFloat(DOM.receiveAmount.value) > 0)
    );
  }

  function checkSwapConditions() {
    return (
      state.swapFromCrypto &&
      state.swapToCrypto &&
      (parseFloat(DOM.swapAmount.value) > 0 ||
        parseFloat(DOM.swapReceiveAmount.value) > 0)
    );
  }

  // Update additional fields visibility
  function updateAdditionalFields() {
    // For buy/sell section
    const buySellConditionsMet = checkBuySellConditions();
    if (buySellConditionsMet && !state.showBuySellAdditionalFields) {
      state.showBuySellAdditionalFields = true;
      DOM.buySellAdditionalFields.classList.add("show");
      document.querySelector(".network-overlay-backdrop").style.display =
        "block";
    } else if (!buySellConditionsMet && state.showBuySellAdditionalFields) {
      state.showBuySellAdditionalFields = false;
      DOM.buySellAdditionalFields.classList.remove("show");
      document.querySelector(".network-overlay-backdrop").style.display =
        "none";
    }

    // For swap section
    const swapConditionsMet = checkSwapConditions();
    if (swapConditionsMet && !state.showSwapAdditionalFields) {
      state.showSwapAdditionalFields = true;
      DOM.swapAdditionalFields.classList.add("show");
    } else if (!swapConditionsMet && state.showSwapAdditionalFields) {
      state.showSwapAdditionalFields = false;
      DOM.swapAdditionalFields.classList.remove("show");
    }
  }

  // Periodically refresh rates (every 2 minutes)
  function startRateRefresh() {
    setInterval(() => {
      state.liveRates = null;
      if (DOM.sendAmount.value || DOM.receiveAmount.value) calculatePrice();
      if (DOM.swapAmount.value || DOM.swapReceiveAmount.value)
        calculateSwapPrice();
    }, 120000);
  }

  // Public API
  return {
    init,
    startRateRefresh,
  };
})();

// Initialize the widget when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  CryptoExchange.init();
  CryptoExchange.startRateRefresh();
});
