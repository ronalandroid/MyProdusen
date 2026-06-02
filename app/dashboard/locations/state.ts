export interface WorkLocationItem {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationFormState {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: string;
  isActive: boolean;
}

export const EMPTY_FORM: LocationFormState = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radius: "100",
  isActive: true,
};

export type ActiveFilter = "all" | "active" | "inactive";

export interface LocationsState {
  locations: WorkLocationItem[];
  isLoading: boolean;
  error: string | null;
  message: string | null;
  searchTerm: string;
  activeFilter: ActiveFilter;
  showModal: boolean;
  editing: WorkLocationItem | null;
  pendingDelete: WorkLocationItem | null;
  form: LocationFormState;
  submitting: boolean;
  deleting: boolean;
}

export const INITIAL_STATE: LocationsState = {
  locations: [],
  isLoading: true,
  error: null,
  message: null,
  searchTerm: "",
  activeFilter: "all",
  showModal: false,
  editing: null,
  pendingDelete: null,
  form: EMPTY_FORM,
  submitting: false,
  deleting: false,
};

export type LocationsAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; locations: WorkLocationItem[] }
  | { type: "loadError"; error: string }
  | { type: "setSearchTerm"; value: string }
  | { type: "setActiveFilter"; value: ActiveFilter }
  | { type: "openCreate" }
  | { type: "openEdit"; location: WorkLocationItem }
  | { type: "closeModal" }
  | { type: "patchForm"; patch: Partial<LocationFormState> }
  | { type: "submitStart" }
  | { type: "submitError"; error: string }
  | { type: "submitSuccess"; message: string }
  | { type: "validationError"; error: string }
  | { type: "requestDelete"; location: WorkLocationItem }
  | { type: "cancelDelete" }
  | { type: "deleteStart" }
  | { type: "deleteError"; error: string }
  | { type: "deleteSuccess"; message: string };

export function locationsReducer(state: LocationsState, action: LocationsAction): LocationsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, isLoading: true, error: null };
    case "loadSuccess":
      return { ...state, isLoading: false, locations: action.locations };
    case "loadError":
      return { ...state, isLoading: false, error: action.error };
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setActiveFilter":
      return { ...state, activeFilter: action.value };
    case "openCreate":
      return { ...state, editing: null, form: EMPTY_FORM, showModal: true };
    case "openEdit":
      return {
        ...state,
        editing: action.location,
        showModal: true,
        form: {
          name: action.location.name,
          address: action.location.address,
          latitude: String(action.location.latitude),
          longitude: String(action.location.longitude),
          radius: String(action.location.radius),
          isActive: action.location.isActive,
        },
      };
    case "closeModal":
      return { ...state, showModal: false, editing: null, form: EMPTY_FORM };
    case "patchForm":
      return { ...state, form: { ...state.form, ...action.patch } };
    case "submitStart":
      return { ...state, submitting: true, error: null, message: null };
    case "submitError":
      return { ...state, submitting: false, error: action.error };
    case "submitSuccess":
      return {
        ...state,
        submitting: false,
        message: action.message,
        showModal: false,
        editing: null,
        form: EMPTY_FORM,
      };
    case "validationError":
      return { ...state, error: action.error, message: null };
    case "requestDelete":
      return { ...state, pendingDelete: action.location };
    case "cancelDelete":
      return { ...state, pendingDelete: null };
    case "deleteStart":
      return { ...state, deleting: true, error: null, message: null };
    case "deleteError":
      return { ...state, deleting: false, error: action.error };
    case "deleteSuccess":
      return { ...state, deleting: false, message: action.message, pendingDelete: null };
    default:
      return state;
  }
}
