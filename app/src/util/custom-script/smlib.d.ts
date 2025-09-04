declare module "app/src/data/FileData" {
    export const AUDIO_EXT: string[];
    export const IMG_EXT: string[];
}
declare module "app/src/chart/stats/parity/ParityDataTypes" {
    import { HoldNotedataEntry, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export enum Foot {
        NONE = 0,
        LEFT_HEEL = 1,
        LEFT_TOE = 2,
        RIGHT_HEEL = 3,
        RIGHT_TOE = 4
    }
    export const FEET: Foot[];
    export const OTHER_PART_OF_FOOT: Foot[];
    export const FEET_LABELS: string[];
    export const FEET_LABELS_LONG: string[];
    export const FEET_LABEL_TO_FOOT: {
        [key: string]: Foot;
    };
    export type FootOverride = "Left" | "Right" | Foot;
    export interface PlacementData {
        previousLeftPos: {
            x: number;
            y: number;
        };
        previousRightPos: {
            x: number;
            y: number;
        };
        leftPos: {
            x: number;
            y: number;
        };
        rightPos: {
            x: number;
            y: number;
        };
        movedLeft: boolean;
        movedRight: boolean;
        leftBracket: boolean;
        rightBracket: boolean;
        previousJumped: boolean;
        jumped: boolean;
        leftJack: boolean;
        rightJack: boolean;
        leftDoubleStep: boolean;
        rightDoubleStep: boolean;
        initialState: ParityState;
        resultState: ParityState;
    }
    export const DEFAULT_WEIGHTS: {
        [key: string]: number;
    };
    export const WEIGHT_SHORT_NAMES: {
        [id: string]: string;
    };
    export enum TechCategory {
        Crossovers = 0,
        Footswitches = 1,
        Sideswitches = 2,
        Jacks = 3,
        Brackets = 4,
        Doublesteps = 5,
        Holdswitch = 6
    }
    export const TECH_STRINGS: Record<number, string>;
    export enum TechErrors {
        UnmarkedDoublestep = 0,
        MissedFootswitch = 1,
        Ambiguous = 2
    }
    export const TECH_DESCRIPTIONS: {
        [key in TechCategory]: {
            title: string;
            description: string;
        };
    };
    export const TECH_ERROR_STRINGS: Record<number, string>;
    export const TECH_ERROR_STRING_REVERSE: Record<string, TechErrors>;
    export const TECH_ERROR_DESCRIPTIONS: {
        [key in TechErrors]: {
            title: string;
            description: string;
        };
    };
    export class ParityState {
        action: Foot[];
        combinedColumns: Foot[];
        movedFeet: Set<Foot>;
        holdFeet: Set<Foot>;
        frontFoot: Foot | null;
        second: number;
        beat: number;
        rowKey: string;
        footColumns: number[];
        constructor(row: Row, action: Foot[], columns?: number[]);
        get leftHeel(): number;
        get leftToe(): number;
        get rightHeel(): number;
        get rightToe(): number;
        toKey(): string;
    }
    export interface Row {
        notes: (NotedataEntry | undefined)[];
        holds: (HoldNotedataEntry | undefined)[];
        holdTails: Set<number>;
        mines: (number | undefined)[];
        fakeMines: (number | undefined)[];
        second: number;
        beat: number;
        columns: Foot[];
        overrides: FootOverride[];
        id: string;
    }
}
declare module "app/src/chart/sm/NoteTypes" {
    import { Foot, FootOverride } from "app/src/chart/stats/parity/ParityDataTypes";
    export type Notedata = NotedataEntry[];
    export type RowData = {
        notes: NotedataEntry[];
        beat: number;
        second: number;
        warped: boolean;
        faked: boolean;
    };
    export type PartialNotedata = PartialNotedataEntry[];
    export const HOLD_NOTE_TYPES: readonly ["Hold", "Roll"];
    export const TAP_NOTE_TYPES: readonly ["Tap", "Mine", "Lift", "Fake"];
    export type NoteType = TapNoteType | HoldNoteType;
    export type HoldNoteType = (typeof HOLD_NOTE_TYPES)[number];
    export type TapNoteType = (typeof TAP_NOTE_TYPES)[number];
    export interface PartialTapNotedataEntry {
        beat: number;
        col: number;
        type: NoteType;
        notemods?: string;
        keysounds?: string;
    }
    export interface PartialHoldNotedataEntry extends PartialTapNotedataEntry {
        hold: number;
    }
    export type PartialNotedataEntry = PartialTapNotedataEntry | PartialHoldNotedataEntry;
    interface ExtraNotedata {
        warped: boolean;
        fake: boolean;
        second: number;
        quant: number;
        gameplay?: {
            hideNote: boolean;
            hasHit: boolean;
        };
        parity?: {
            foot?: Foot;
            override?: FootOverride;
            tech?: string;
        };
    }
    export type TapNotedataEntry = PartialTapNotedataEntry & ExtraNotedata;
    export type HoldNotedataEntry = PartialHoldNotedataEntry & ExtraNotedata & {
        gameplay?: {
            lastHoldActivation?: number;
            droppedHoldBeat?: number;
        };
    };
    export type NotedataEntry = TapNotedataEntry | HoldNotedataEntry;
    export function isTapNote<T extends PartialNotedataEntry>(note: T): note is Exclude<T, {
        hold: number;
    }>;
    export function isHoldNote<T extends PartialNotedataEntry>(note: T): note is Extract<T, {
        hold: number;
    }>;
}
declare module "app/src/util/Util" {
    import { PartialNotedataEntry } from "app/src/chart/sm/NoteTypes";
    export const IS_OSX: boolean;
    export const QUANTS: number[];
    export const QUANT_NAMES: string[];
    export const QUANT_NUM: number[];
    export function getQuantIndex(beat: number): number;
    export function getNoteEnd(note: PartialNotedataEntry): number;
    export function isSameRow(beat1: number, beat2: number): boolean;
    export function toRowIndex(beat: number): number;
    export function getDivision(beat: number): number;
    export function bsearch<T>(arr: T[], value: number, property?: (a: T) => number): number;
    export function bsearchEarliest<T>(arr: T[], value: number, property?: (a: T) => number): number;
    export function previousInSorted(arr: number[], value: number, lambda?: number): number | null;
    export function nextInSorted(arr: number[], value: number, lambda?: number): number | null;
    export function countOfItem<T>(array: T[], item: T): number;
    export function arraysAreEqual<T>(array1: T[], array2: T[]): boolean;
    /**
     * Returns the start and end indices of the elements within the
     * given range in a sorted array.
     *
     * @export
     * @template T
     * @param {T[]} array The array to search in.
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @param {(obj: T) => number} index A function that returns the index of the object.
     * @return {[number, number]} The start and end indices of the elements within the range. The start index is inclusive and the end index is exclusive.
     */
    export function getRangeInSortedArray<T>(array: T[], start: number, end: number, index: (obj: T) => number): number[];
    export function compareObjects(a: any, b: any): boolean;
    export function parseString(expr: string): number | null;
    export function capitalize(str: string): string;
    export function formatSeconds(seconds: number): string;
    export function formatBytes(bytes: number): string;
    export function isIFrame(): boolean;
    global {
        const WorkerGlobalScope: any;
    }
    export function isWorker(): boolean;
}
declare module "app/src/gui/element/WaterfallManager" {
    export class WaterfallManager {
        private static _view;
        private static messages;
        private static get view();
        static create(message: string): void;
        static createFormatted(message: string | Error, type: "log" | "warn" | "error"): void;
    }
}
declare module "app/src/util/Math" {
    export function lerp(v0: number, v1: number, t: number): number;
    export function unlerp(min: number, max: number, value: number): number;
    export function roundDigit(num: number, scale: number): number;
    export function clamp(val: number, low: number, high: number): number;
    export function stdDev(array: number[]): number;
    export function median(array: number[]): number;
    export function mean(array: number[]): number;
    export function gcd2(a: number, b: number): number;
    export function lcm2(a: number, b: number): number;
    export function lcm(array: number[]): number;
    export function minArr(array: number[]): number;
    export function maxArr(array: number[]): number;
}
declare module "app/src/chart/sm/TimingTypes" {
    export const TIMING_EVENT_NAMES: readonly ["BPMS", "STOPS", "WARPS", "DELAYS", "LABELS", "SPEEDS", "SCROLLS", "TICKCOUNTS", "TIMESIGNATURES", "COMBOS", "FAKES", "ATTACKS", "BGCHANGES", "FGCHANGES"];
    export type TimingEventType = (typeof TIMING_EVENT_NAMES)[number];
    export type TimingType = "OFFSET" | TimingEventType;
    export const BEAT_TIMING_EVENT_NAMES: readonly ["BPMS", "STOPS", "WARPS", "DELAYS", "WARP_DEST"];
    export type BeatTimingEventType = (typeof BEAT_TIMING_EVENT_NAMES)[number];
    export interface BeatTimingCache {
        beat: number;
        secondBefore: number;
        secondOf: number;
        secondAfter: number;
        secondClamp: number;
        bpm: number;
        warped: boolean;
    }
    export interface MeasureTimingCache {
        beat: number;
        measure: number;
        beatsPerMeasure: number;
        divisionLength: number;
        numDivisions: number;
    }
    export interface ScrollCacheTimingEvent extends ScrollTimingEvent {
        effectiveBeat?: number;
    }
    export interface BPMTimingEvent {
        type: "BPMS";
        beat: number;
        value: number;
    }
    export interface StopTimingEvent {
        type: "STOPS";
        beat: number;
        value: number;
    }
    export interface WarpTimingEvent {
        type: "WARPS";
        beat: number;
        value: number;
    }
    export interface WarpDestTimingEvent {
        type: "WARP_DEST";
        beat: number;
        value: number;
    }
    export interface DelayTimingEvent {
        type: "DELAYS";
        beat: number;
        value: number;
    }
    export interface ScrollTimingEvent {
        type: "SCROLLS";
        beat: number;
        value: number;
    }
    export interface TickCountTimingEvent {
        type: "TICKCOUNTS";
        beat: number;
        value: number;
    }
    export interface FakeTimingEvent {
        type: "FAKES";
        beat: number;
        value: number;
    }
    export interface LabelTimingEvent {
        type: "LABELS";
        beat: number;
        value: string;
    }
    export interface SpeedTimingEvent {
        type: "SPEEDS";
        beat: number;
        value: number;
        delay: number;
        unit: "B" | "T";
    }
    export interface TimeSignatureTimingEvent {
        type: "TIMESIGNATURES";
        beat: number;
        upper: number;
        lower: number;
    }
    export interface ComboTimingEvent {
        type: "COMBOS";
        beat: number;
        hitMult: number;
        missMult: number;
    }
    export interface AttackTimingEvent {
        type: "ATTACKS";
        second: number;
        endType: "LEN" | "END";
        value: number;
        mods: string;
    }
    export interface BGChangeTimingEvent {
        type: "BGCHANGES";
        beat: number;
        file: string;
        updateRate: number;
        crossFade: boolean;
        stretchRewind: boolean;
        stretchNoLoop: boolean;
        effect: string;
        file2: string;
        transition: string;
        color1: string;
        color2: string;
    }
    export interface FGChangeTimingEvent {
        type: "FGCHANGES";
        beat: number;
        file: string;
        updateRate: number;
        crossFade: boolean;
        stretchRewind: boolean;
        stretchNoLoop: boolean;
        effect: string;
        file2: string;
        transition: string;
        color1: string;
        color2: string;
    }
    export type TimingEvent = BPMTimingEvent | StopTimingEvent | WarpTimingEvent | DelayTimingEvent | ScrollTimingEvent | TickCountTimingEvent | FakeTimingEvent | LabelTimingEvent | SpeedTimingEvent | TimeSignatureTimingEvent | ComboTimingEvent | AttackTimingEvent | BGChangeTimingEvent | FGChangeTimingEvent;
    export type Cached<T extends TimingEvent> = T & {
        beat: number;
        second: number;
    };
    export type BeatTimingEvent = BPMTimingEvent | StopTimingEvent | WarpTimingEvent | WarpDestTimingEvent | DelayTimingEvent;
    export type TimingCache = {
        beatTiming?: BeatTimingCache[];
        effectiveBeatTiming?: ScrollCacheTimingEvent[];
        measureTiming?: MeasureTimingCache[];
        sortedEvents?: Cached<TimingEvent>[];
        warpedBeats: Map<number, boolean>;
        beatsToSeconds: Map<string, number>;
    };
    export type DeletableEvent = Partial<Cached<TimingEvent>> & Pick<TimingEvent, "type">;
    export type ColumnType = "continuing" | "instant";
    export interface TimingColumn<Event extends TimingEvent> {
        type: TimingEventType;
        events: Cached<Event>[];
    }
}
declare module "app/src/util/EventHandler" {
    import EventEmitter from "eventemitter3";
    export class EventHandler extends EventEmitter {
        private static _instance;
        static get instance(): EventHandler;
        static emit(event: string | symbol, ...args: any[]): boolean;
        static on(event: string | symbol, fn: (...args: any[]) => void, context?: any): void;
        static off(event: string | symbol, fn?: (...args: any[]) => void, context?: any, once?: boolean): void;
    }
}
declare module "app/src/util/Options" {
    import { TimingEventType } from "app/src/chart/sm/TimingTypes";
    export class DefaultOptions {
        static app: {
            width: number;
            height: number;
            fullscreen: boolean;
        };
        static general: {
            uiScale: number;
            spinnerStep: number;
            smoothAnimations: boolean;
            autosaveInterval: number;
            warnBeforeExit: boolean;
            showPlaybackOptions: boolean;
            loadSSC: string;
            theme: string;
        };
        static chart: {
            CMod: boolean;
            reverse: boolean;
            mousePlacement: boolean;
            defaultHoldPlacement: boolean;
            zoom: number;
            speed: number;
            snap: number;
            hideWarpedArrows: boolean;
            hideFakedArrows: boolean;
            forceSnapNotes: boolean;
            doSpeedChanges: boolean;
            drawNoteFlash: boolean;
            drawIcons: boolean;
            allowReceptorDrag: boolean;
            receptorYPos: number;
            receptorXPos: number;
            maxDrawBeats: number;
            maxDrawBeatsBack: number;
            scroll: {
                scrollSensitivity: number;
                scrollSnapEveryScroll: boolean;
                invertScroll: boolean;
                invertZoomScroll: boolean;
                invertReverseScroll: boolean;
            };
            parity: {
                enabled: boolean;
                showHighlights: boolean;
                showTech: boolean;
                showCandles: boolean;
                showErrors: boolean;
                showDancingBot: boolean;
                leftHeelColor: string;
                leftToeColor: string;
                rightHeelColor: string;
                rightToeColor: string;
            };
            waveform: {
                enabled: boolean;
                antialiasing: boolean;
                color: string;
                allowFilter: boolean;
                filteredColor: string;
                lineHeight: number;
                speedChanges: boolean;
            };
            layoutFollowPosition: boolean;
            noteLayout: {
                enabled: boolean;
            };
            npsGraph: {
                enabled: boolean;
                color1: string;
                color2: string;
            };
            facingLayout: {
                enabled: boolean;
            };
            timingEventOrder: {
                left: string[];
                right: string[];
            };
            renderTimingEvent: { [key in TimingEventType]: boolean; };
            noteskin: {
                type: string;
                name: string;
            };
            lastNoteskins: Record<string, string>;
        };
        static audio: {
            assistTick: boolean;
            metronome: boolean;
            rate: number;
            masterVolume: number;
            songVolume: number;
            soundEffectVolume: number;
            allowFilter: boolean;
        };
        static play: {
            offset: number;
            effectOffset: number;
            visualOffset: number;
            hideBarlines: boolean;
            judgementTilt: boolean;
            timingCollection: string;
            timingWindowScale: number;
            timingWindowAdd: number;
            defaultTimingCollections: {
                [key: string]: string;
            };
        };
        static performance: {
            antialiasing: boolean;
            resolution: number;
        };
        static debug: {
            showFPS: boolean;
            showTimers: boolean;
            showScroll: boolean;
            showNoteskinErrors: boolean;
            showDebugVariables: boolean;
            parity: {
                showGraph: boolean;
                limitGraph: boolean;
                showDebug: boolean;
            };
        };
    }
    export type OptionsObject = {
        [key: string]: any;
    };
    export class Options extends DefaultOptions {
        private static extractOptions;
        static applyOption(option: [string, any]): void;
        static getDefaultOption(id: string): any;
        static getOption(id: string): any;
        static saveOptions(): void;
        static loadOptions(): void;
        static clearSave(): void;
    }
}
declare module "app/src/gui/Icons" {
    class Icon extends HTMLDivElement {
        _width: number | undefined;
        _height: number | undefined;
        _color: string | undefined;
        _svg: HTMLElement | undefined;
        loadSVG(svg: string): void;
        private updateStyles;
        get width(): number | undefined;
        set width(value: number | undefined);
        get height(): number | undefined;
        set height(value: number | undefined);
        get color(): string | undefined;
        set color(value: string | undefined);
    }
    export class Icons {
        static cache: Map<string, string>;
        private static pendingWrappers;
        static getIcon(id: string, width?: number, height?: number, color?: string): Icon;
        static getReactIcon(id: string, width?: number, height?: number, color?: string): import("react/jsx-runtime").JSX.Element;
        private static fetchIcon;
    }
    interface ReactIconProps {
        id: string;
        width?: number;
        height?: number;
        color?: string;
        style?: string;
    }
    export function ReactIcon({ id, width, height, color, style }: ReactIconProps): import("react/jsx-runtime").JSX.Element;
}
declare module "app/src/gui/window/WindowManager" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class WindowManager {
        view: HTMLDivElement;
        windows: Window[];
        app: App;
        constructor(app: App, view: HTMLDivElement);
        unfocusAll(): void;
        getFocusedWindow(): Window | null;
        isBlocked(): boolean;
        openWindow(window: Window): void;
        removeWindow(window: Window): void;
        getWindowById(id: string): Window | undefined;
    }
}
declare module "app/src/gui/window/Window" {
    import { WindowManager } from "app/src/gui/window/WindowManager";
    export interface WindowOptions {
        title: string;
        width: number;
        height?: number;
        win_id?: string;
        disableClose?: boolean;
        blocking?: boolean;
    }
    export abstract class Window {
        private windowManager?;
        private minimizeElement;
        private closeElement;
        closed: boolean;
        options: WindowOptions;
        windowElement: HTMLDivElement;
        viewElement: HTMLDivElement;
        protected constructor(options: WindowOptions);
        abstract initView(): void;
        addToManager(windowManager: WindowManager): void;
        onClose(): void;
        closeWindow(): void;
        focus(): void;
        unfocus(): void;
        center(): void;
        private block;
        private handleDrag;
        private clampPosition;
        move(x: number, y: number): void;
        setDisableClose(disable: boolean): void;
        setBlocking(blocking: boolean): void;
    }
}
declare module "app/src/gui/window/AboutWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class AboutWindow extends Window {
        app: App;
        constructor(app: App);
        initView(): void;
    }
}
declare module "app/src/util/Theme" {
    import { Color } from "pixi.js";
    import { Theme, ThemeProperty, ThemeString } from "app/src/data/ThemeData";
    export class Themes {
        private static _themes;
        private static _userThemes;
        private static _initialized;
        private static style;
        private static currentTheme;
        private static initialize;
        private static _createThemeStyle;
        private static _loadUserThemes;
        private static _saveUserThemes;
        private static validateTheme;
        static getThemes(): {
            [x: string]: Theme;
        };
        static getBuiltinThemes(): Record<string, Theme>;
        static getUserThemes(): Record<string, Theme>;
        static loadTheme(id: string): void;
        static _applyTheme(theme: Theme): void;
        static loadThemeFromColors(theme: ThemeString): void;
        static getCurrentTheme(): Theme;
        private static convertThemeToString;
        static exportCurrentTheme(options?: {
            code?: boolean;
            spaces?: boolean;
        }): string;
        static createUserTheme(id: string, base?: Theme): void;
        static setUserTheme(id: string, base: Theme): void;
        static deleteUserTheme(id: string): void;
        static renameUserTheme(id: string, newId: string): void;
        static parseThemeText(text: string): Theme | null;
        static getColor(id: ThemeProperty): Color;
        static isDarkTheme(): boolean;
    }
}
declare module "app/src/util/Path" {
    export function basename(path: string, ext?: string): string;
    export function dirname(path: string): string;
    export function extname(path: string): string;
}
declare module "app/src/gui/window/ConfirmationWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    interface ConfirmationOption {
        label: string;
        callback?: () => void;
        type: "delete" | "confirm" | "default";
    }
    export class ConfirmationWindow extends Window {
        app: App;
        private buttonOptions;
        private readonly message;
        private readonly detail?;
        private resolve?;
        resolved: Promise<string>;
        constructor(app: App, title: string, message: string, buttonOptions: ConfirmationOption[], detail?: string);
        initView(): void;
    }
}
declare module "app/src/gui/window/ThemeSelectionWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class ThemeSelectionWindow extends Window {
        app: App;
        private grid;
        private actions;
        constructor(app: App);
        initView(): void;
        createOptionTray(): HTMLDivElement;
        loadGrid(): void;
        removeAllSelections(): void;
        filterGrid(query: string): void;
        containsQuery(query: string, string: string | undefined): boolean;
        getNonConflictingName(base: string): string;
    }
}
declare module "app/src/gui/window/ThemeEditorWindow" {
    import { Color } from "pixi.js";
    import { App } from "app/src/App";
    import { Theme, ThemeGroup, ThemeProperty } from "app/src/data/ThemeData";
    import { Window } from "app/src/gui/window/Window";
    export class ThemeEditorWindow extends Window {
        app: App;
        private pickers;
        private handlers;
        private linkBlacklist;
        static isOpen: boolean;
        constructor(app: App);
        initView(): void;
        createGroup(group: ThemeGroup): HTMLDivElement;
        createPicker(opt: {
            id: ThemeProperty;
            label: string;
        }): HTMLDivElement;
        getLink(id: ThemeProperty): "accent-color" | "editor-bg" | "widget-bg" | "editable-overlay-hover" | "editable-overlay-active" | "text-color" | "text-color-secondary" | "text-color-detail" | "text-color-disabled" | "primary-bg" | "primary-border" | "primary-bg-active" | "primary-bg-hover" | "secondary-bg" | "secondary-border" | "secondary-bg-active" | "secondary-bg-hover" | "tooltip-bg" | "input-bg" | "input-bg-active" | "input-bg-hover" | "input-border" | "navbar-bg" | "navbar-bg-inactive" | "window-bg" | "window-border" | null;
        average(c: Color): number;
        lighten(color: Color, gamma: number): Color;
        add(color: Color, gamma: number): Color;
        updateLinks(updatedId: ThemeProperty, theme: Theme): Theme;
        onClose(): void;
    }
}
declare module "app/src/data/ThemeData" {
    import { Color } from "pixi.js";
    import { ThemeEditorWindow } from "app/src/gui/window/ThemeEditorWindow";
    export const THEME_VAR_WHITELIST: readonly ["accent-color", "editor-bg", "widget-bg", "editable-overlay-hover", "editable-overlay-active", "text-color", "text-color-secondary", "text-color-detail", "text-color-disabled", "primary-bg", "primary-border", "primary-bg-active", "primary-bg-hover", "secondary-bg", "secondary-border", "secondary-bg-active", "secondary-bg-hover", "tooltip-bg", "input-bg", "input-bg-active", "input-bg-hover", "input-border", "navbar-bg", "navbar-bg-inactive", "window-bg", "window-border"];
    export type ThemeProperty = (typeof THEME_VAR_WHITELIST)[number];
    export type ThemeString = {
        [key in ThemeProperty]: string;
    };
    export type Theme = {
        [key in ThemeProperty]: Color;
    };
    export type ThemeGroup = {
        name: string;
        ids: {
            id: ThemeProperty;
            label: string;
        }[];
    };
    export const THEME_GRID_PROPS: ThemeProperty[];
    export const THEME_GROUPS: ThemeGroup[];
    export const THEME_PROPERTY_DESCRIPTIONS: {
        [key in ThemeProperty]: string;
    };
    export type ThemeColorLinks = {
        [key in ThemeProperty]?: (this: ThemeEditorWindow, c: Color) => Color;
    };
    export const THEME_GENERATOR_LINKS: {
        [key in ThemeProperty]?: ThemeColorLinks;
    };
    export const DEFAULT_THEMES: Record<string, Theme>;
}
declare module "app/src/util/Color" {
    import { Color, ColorSource } from "pixi.js";
    import { Foot } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ThemeProperty } from "app/src/data/ThemeData";
    export function rgbtoHex(r: number, g: number, b: number): number;
    export function lighten(col: number, gamma: number): number;
    export function add(col: number, gamma: number): number;
    export function average(c: Color): number;
    export function blendColors(colorA: string, colorB: string, amount: number): string;
    export function blendPixiColors(colorA: Color, colorB: Color, amount: number): Color;
    type TintableObject = {
        tint: ColorSource;
        alpha: number;
        destroyed: boolean;
    };
    export function assignTint(element: TintableObject, id: ThemeProperty): void;
    export function colorToHsla(color: Color): number[];
    export function colorToHsva(color: Color): number[];
    export function colorFallback(colorString: ColorSource, fallback?: ColorSource): Color;
    export function getParityColor(foot: Foot | undefined): Color;
}
declare module "app/src/gui/element/ColorPicker" {
    import { Color } from "pixi.js";
    class TransparentPreview extends HTMLDivElement {
        colorElement: HTMLDivElement;
        set color(value: Color);
    }
    interface ColorPickerOptions {
        value: string;
        height?: number;
        width?: number;
    }
    export class ColorPicker extends TransparentPreview {
        private _value;
        private _hue;
        private _sat;
        private _val;
        private _alp;
        private popup?;
        private matrix?;
        private matrixDot?;
        private matrixDragging;
        private hueDragging;
        private hueThumb?;
        private alphaDragging;
        private alphaBg?;
        private alphaThumb?;
        private previewNew?;
        private formats;
        onColorChange?: (color: Color) => void;
        static create(options: ColorPickerOptions): ColorPicker;
        private updatePreview;
        get value(): Color;
        set value(color: Color);
        get hue(): number;
        set hue(value: number);
        get sat(): number;
        set sat(value: number);
        get val(): number;
        set val(value: number);
        get alpha(): number;
        set alpha(value: number);
        updateColor(): void;
        createPopup(): void;
        updatePopup(): void;
        closePopup(): void;
        createMatrix(): HTMLDivElement[];
        createSlider(opt: {
            ondrag?: () => void;
            change: (val: number) => void;
            offdrag?: () => void;
        }): HTMLDivElement[];
        private movePosition;
        isActive(): boolean;
    }
}
declare module "app/src/gui/element/Dropdown" {
    export class Dropdown<T> {
        view: HTMLDivElement;
        private items;
        private selectedItem;
        private onChangeHandlers;
        static create<T>(items?: readonly T[], selectedItem?: T): Dropdown<T>;
        private constructor();
        onChange(handler: (value: T, index: number) => void): void;
        removeHandler(handler: (value: T, index: number) => void): void;
        getItems(): readonly T[];
        setItems(items: readonly T[]): void;
        setSelected(item?: T): void;
        closeDropdown(): void;
        get value(): T;
        get disabled(): boolean;
        set disabled(value: boolean);
        private createDropdown;
    }
}
declare module "app/src/gui/element/NumberSlider" {
    interface SliderOptions {
        value?: number;
        width?: number;
        min: number;
        max: number;
        step: number;
        precision?: number;
        transformer?: (value: number) => string | number;
        onChange?: (value: number) => void;
        displayWidth?: number;
    }
    export class NumberSlider {
        view: HTMLDivElement;
        slider: HTMLInputElement;
        text: HTMLDivElement;
        options: SliderOptions;
        constructor(view: HTMLDivElement, options: SliderOptions);
        get value(): number;
        setValue(value: number): void;
        static create(options: SliderOptions): NumberSlider;
        private formatValue;
    }
}
declare module "app/src/gui/element/NumberSpinner" {
    interface NumberSpinnerOptions {
        value: number;
        step: number | null;
        precision: number;
        minPrecision: number | null;
        min: number;
        max: number;
        onChange?: (value: number | undefined) => void;
    }
    export class NumberSpinner {
        readonly view: HTMLDivElement;
        readonly input: HTMLInputElement;
        private options;
        private lastVal;
        constructor(view: HTMLDivElement, options: Partial<NumberSpinnerOptions>);
        static create(options: Partial<NumberSpinnerOptions>): NumberSpinner;
        private formatValue;
        get value(): number;
        set value(value: number);
        get step(): number | null;
        set step(value: number | null);
        get min(): number;
        set min(value: number);
        get max(): number;
        set max(value: number);
        get precision(): number;
        set precision(value: number);
        get minPrecision(): number | null;
        set minPrecision(value: number | null);
        get onchange(): ((value: number | undefined) => void) | undefined;
        set onchange(value: ((value: number | undefined) => void) | undefined);
        get disabled(): boolean;
        set disabled(value: boolean);
    }
}
declare module "app/src/gui/element/ValueInput" {
    import { App } from "app/src/App";
    export interface TextInput {
        type: "text";
        transformers?: {
            serialize: (value: string) => string;
            deserialize: (value: string) => string;
        };
        onChange?: (app: App, value: string) => void;
    }
    export type DropdownInput<T> = {
        type: "dropdown";
        items: readonly string[];
        advanced: false;
        onChange?: (app: App, value: string | number) => void;
    } | {
        type: "dropdown";
        items: readonly number[];
        advanced: false;
        onChange?: (app: App, value: string | number) => void;
    } | {
        type: "dropdown";
        items: T[];
        advanced: true;
        transformers: {
            serialize: (value: string | number | boolean) => T;
            deserialize: (value: T) => string | number | boolean;
        };
        onChange?: (app: App, value: string | number | boolean) => void;
    };
    export interface NumberInput {
        type: "number";
        step: number;
        precision?: number;
        minPrecision?: number;
        min?: number;
        max?: number;
        transformers?: {
            serialize: (value: number) => number;
            deserialize: (value: number) => number;
        };
        onChange?: (app: App, value: number) => void;
    }
    export interface SliderInput {
        type: "slider";
        step?: number;
        min?: number;
        max?: number;
        hardMax?: number;
        hardMin?: number;
        transformers?: {
            serialize: (value: number) => number;
            deserialize: (value: number) => number;
        };
        onChange?: (app: App, value: number) => void;
    }
    export interface DisplaySliderInput {
        type: "display-slider";
        step: number;
        min: number;
        max: number;
        transformers: {
            serialize: (value: number) => number;
            deserialize: (value: number) => number;
            display: (value: number) => string | number;
        };
        onChange?: (app: App, value: number) => void;
        displayWidth?: number;
        width?: number;
    }
    export interface CheckboxInput {
        type: "checkbox";
        onChange?: (app: App, value: boolean) => void;
    }
    export interface ColorInput {
        type: "color";
        onChange?: (app: App, value: string) => void;
    }
    export type ValueInput<T> = TextInput | DropdownInput<T> | NumberInput | CheckboxInput | SliderInput | DisplaySliderInput | ColorInput;
    export function createLabeledInput<T>(app: App, name: string, input: ValueInput<T>, initialValue: any): HTMLDivElement;
    export function createValueInput<T>(app: App, input: ValueInput<T>, initialValue: any): HTMLElement;
}
declare module "app/src/chart/play/JudgementTexture" {
    import { Texture } from "pixi.js";
    import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow";
    export class JudgementTexture {
        static ITG: JudgementTexture;
        static WATERFALL: JudgementTexture;
        static PUMP: JudgementTexture;
        private texHeight;
        private texWidth;
        private texture?;
        private judgeNames;
        private earlyLate;
        private path;
        constructor(path: string, judgeNames: string[], earlyLate?: boolean);
        private loadTex;
        getTexture(error: number, judgment: StandardTimingWindow): Promise<Texture | undefined>;
    }
}
declare module "app/src/chart/play/TimingWindow" {
    export abstract class TimingWindow {
        timingWindowMS: number;
        dancePoints: number;
        lifeChange: number;
        protected constructor(timingWindowMS: number, dancePoints: number, lifeChange: number);
        /**
         * Returns the calculated milliseconds to achieve this timing window.
         * Includes options timingWindowScale and timingWindowAdd.
         *
         * @return {*}
         * @memberof TimingWindow
         */
        getTimingWindowMS(): number;
    }
}
declare module "app/src/chart/play/StandardTimingWindow" {
    import { JudgementTexture } from "app/src/chart/play/JudgementTexture";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    export class StandardTimingWindow extends TimingWindow {
        id: string;
        name: string;
        color: number;
        judgementTexture: JudgementTexture;
        constructor(id: string, name: string, color: number, timingWindowMS: number, dancePoints: number, lifeChange: number, judgementTexture: JudgementTexture);
    }
    export const TIMING_WINDOW_AUTOPLAY: StandardTimingWindow;
}
declare module "app/src/chart/play/HoldDroppedTimingWindow" {
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    export class HoldDroppedTimingWindow extends TimingWindow {
        readonly target = "dropped";
        constructor(dancePoints: number, lifeChange: number);
    }
}
declare module "app/src/chart/play/HoldTimingWindow" {
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    export class HoldTimingWindow extends TimingWindow {
        noteType: string;
        constructor(noteType: string, timingWindowMS: number, dancePoints: number, lifeChange: number);
    }
}
declare module "app/src/chart/play/MineTimingWindow" {
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    export class MineTimingWindow extends TimingWindow {
        readonly target = "mine";
        constructor(timingWindowMS: number, dancePoints: number, lifeChange: number);
    }
}
declare module "app/src/chart/play/StandardMissTimingWindow" {
    import { JudgementTexture } from "app/src/chart/play/JudgementTexture";
    import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow";
    export class StandardMissTimingWindow extends StandardTimingWindow {
        constructor(name: string, color: number, dancePoints: number, lifeChange: number, judgementTexture: JudgementTexture);
    }
}
declare module "app/src/chart/play/TimingWindowCollection" {
    import { HoldNotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { HoldDroppedTimingWindow } from "app/src/chart/play/HoldDroppedTimingWindow";
    import { HoldTimingWindow } from "app/src/chart/play/HoldTimingWindow";
    import { MineTimingWindow } from "app/src/chart/play/MineTimingWindow";
    import { StandardMissTimingWindow } from "app/src/chart/play/StandardMissTimingWindow";
    import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    export function isStandardTimingWindow(window: TimingWindow): window is StandardTimingWindow;
    export function isStandardMissTimingWindow(window: TimingWindow): window is StandardMissTimingWindow;
    export function isHoldTimingWindow(window: TimingWindow): window is HoldTimingWindow;
    export function isHoldDroppedTimingWindow(window: TimingWindow): window is HoldDroppedTimingWindow;
    export function isMineTimingWindow(window: TimingWindow): window is MineTimingWindow;
    export class TimingWindowCollection {
        private static COLLECTIONS;
        private windows;
        private holdWindows;
        private readonly missWindow;
        private readonly droppedWindow;
        private readonly mineWindow;
        private readonly hideLimitMS;
        constructor(windows: TimingWindow[], minHideMS: number);
        /**
         * Returns the achieved judgement given an error in ms.
         *
         * @param {number} error
         * @return {*}  {StandardTimingWindow}
         * @memberof TimingWindowCollection
         */
        judgeInput(error: number): StandardTimingWindow;
        /**
         * Gets the held judgement in this collection for a given note.
         *
         * @param {HoldNotedataEntry} note
         * @return {*}  {HoldTimingWindow}
         * @memberof TimingWindowCollection
         */
        getHeldJudgement(note: HoldNotedataEntry): HoldTimingWindow;
        /**
         * Gets this miss judgement in this collection.
         *
         * @return {*}  {StandardMissTimingWindow}
         * @memberof TimingWindowCollection
         */
        getMissJudgement(): StandardMissTimingWindow;
        /**
         * Gets the dropped judgement in this collection.
         *
         * @return {*}  {HoldDroppedTimingWindow}
         * @memberof TimingWindowCollection
         */
        getDroppedJudgement(): HoldDroppedTimingWindow;
        /**
         * Gets the mine judgement in this collection.
         *
         * @return {*}  {MineTimingWindow}
         * @memberof TimingWindowCollection
         */
        getMineJudgement(): MineTimingWindow;
        /**
         * Determines if a note should be hidden.
         *
         * @param {StandardTimingWindow} judgement
         * @return {*}  {boolean}
         * @memberof TimingWindowCollection
         */
        shouldHideNote(judgement: StandardTimingWindow): boolean;
        /**
         * Returns the maximum MS to get a judgement (non-miss).
         *
         * @return {*}  {number}
         * @memberof TimingWindowCollection
         */
        maxWindowMS(): number;
        /**
         * Returns the maximum dance points achievable for one judgement.
         *
         * @return {*}  {number}
         * @memberof TimingWindowCollection
         */
        getMaxDancePoints(): number;
        /**
         * Returns the maximum dance points achievable for one hold judgement.
         *
         * @return {*}  {number}
         * @memberof TimingWindowCollection
         */
        getMaxHoldDancePoints(noteType: string): number;
        /**
         * Returns the standard timing windows.
         *
         * @return {*}  {StandardTimingWindow[]}
         * @memberof TimingWindowCollection
         */
        getStandardWindows(): StandardTimingWindow[];
        /**
         * Returns the hold timing windows.
         *
         * @return {*}  {HoldTimingWindow[]}
         * @memberof TimingWindowCollection
         */
        getHoldWindows(): HoldTimingWindow[];
        /**
         * Returns the TimingWindowCollection with the given name.
         *
         * @static
         * @param {string} name
         * @return {*}  {TimingWindowCollection}
         * @memberof TimingWindowCollection
         */
        static getCollection(name: string): TimingWindowCollection;
        /**
         * Returns all the TimingWindowCollections registered.
         *
         * @static
         * @return {*}
         * @memberof TimingWindowCollection
         */
        static getCollections(): any;
    }
}
declare module "app/src/util/ActionHistory" {
    import type { App } from "app/src/App";
    export interface UndoableAction {
        action: (app?: App) => void;
        undo: (app?: App) => void;
        redo?: (app?: App) => void;
    }
    export class ActionHistory {
        private items;
        private itemIndex;
        private limit;
        private readonly app?;
        static instance: ActionHistory;
        constructor(app?: App);
        run(action: UndoableAction): void;
        undo(): void;
        redo(): void;
        reset(): void;
        canUndo(): boolean;
        canRedo(): boolean;
        setLimit(): void;
        isDirty(): boolean;
        merge(n: number): void;
    }
}
declare module "app/src/chart/sm/TimingData" {
    import { AttackTimingEvent, BGChangeTimingEvent, BPMTimingEvent, BeatTimingCache, Cached, ComboTimingEvent, DelayTimingEvent, DeletableEvent, FGChangeTimingEvent, FakeTimingEvent, LabelTimingEvent, ScrollTimingEvent, SpeedTimingEvent, StopTimingEvent, TickCountTimingEvent, TimeSignatureTimingEvent, TimingCache, TimingColumn, ColumnType as TimingColumnType, TimingEvent, TimingEventType, TimingType, WarpTimingEvent } from "app/src/chart/sm/TimingTypes";
    export const TIMING_DATA_PRECISION = 6;
    export const TIMING_DATA_DISPLAY_PRECISION = 3;
    export abstract class TimingData {
        protected readonly _cache: TimingCache;
        protected columns: {
            [Type in TimingEventType]?: TimingColumn<Extract<TimingEvent, {
                type: Type;
            }>>;
        };
        protected offset?: number;
        protected callListeners(modifiedEvents?: {
            type: TimingEventType;
        }[]): void;
        private buildBeatTimingDataCache;
        private buildEffectiveBeatTimingDataCache;
        private buildMeasureTimingCache;
        private binarySearch;
        private binarySearchIndex;
        private mergeColumns;
        private mergeTwoColumns;
        private splitEvents;
        private splitEventPairs;
        abstract getColumn<Type extends TimingEventType>(type: Type): TimingColumn<Extract<TimingEvent, {
            type: Type;
        }>>;
        parse(type: TimingType, data: string): void;
        abstract getOffset(): number;
        setOffset(offset: number): void;
        serialize(fileType: "sm" | "ssc" | "smebak"): string;
        private formatProperty;
        protected createColumn(type: TimingEventType): void;
        private getTime;
        private isNullEvent;
        private isSimilar;
        private removeOverlapping;
        private compareEvents;
        protected insertEvents(type: TimingEventType, events: TimingEvent[]): (Cached<WarpTimingEvent> | Cached<BPMTimingEvent> | Cached<ScrollTimingEvent> | Cached<TimeSignatureTimingEvent> | Cached<StopTimingEvent> | Cached<DelayTimingEvent> | Cached<LabelTimingEvent> | Cached<SpeedTimingEvent> | Cached<TickCountTimingEvent> | Cached<ComboTimingEvent> | Cached<FakeTimingEvent> | Cached<AttackTimingEvent> | Cached<BGChangeTimingEvent> | Cached<FGChangeTimingEvent>)[];
        protected deleteEvents(type: TimingEventType, events: DeletableEvent[]): Cached<TimingEvent>[];
        static getColumnType(type: TimingEventType): TimingColumnType;
        protected findConflictingEvents(type: TimingEventType): TimingEvent[];
        protected parseEvents<Type extends TimingEventType>(type: Type, data: string): void;
        protected typeRequiresSSC(type: TimingEventType): boolean;
        getDefaultEvent(type: TimingEventType, beat: number): Cached<TimingEvent>;
        getEventAtBeat<Type extends TimingEventType>(type: Type, beat: number, useDefault?: boolean): Cached<Extract<TimingEvent, {
            type: Type;
        }>> | undefined;
        protected updateEvents(type: TimingEventType): void;
        _insert(events: TimingEvent[]): {
            events: TimingEvent[];
            insertConflicts: TimingEvent[];
            errors: TimingEvent[];
        };
        _modify(events: [TimingEvent, TimingEvent][]): {
            newEvents: TimingEvent[];
            oldEvents: TimingEvent[];
            insertConflicts: TimingEvent[];
            errors: TimingEvent[];
        };
        _delete(events: DeletableEvent[]): {
            removedEvents: Cached<TimingEvent>[];
            errors: TimingEvent[];
        };
        insert(events: TimingEvent[]): void;
        modify(events: [TimingEvent, TimingEvent][]): void;
        delete(events: DeletableEvent[]): void;
        findEvents(events: TimingEvent[]): Cached<TimingEvent>[];
        getBeatFromSeconds(seconds: number): number;
        getSecondsFromBeat(beat: number, option?: "noclamp" | "before" | "after" | ""): number;
        isBeatWarped(beat: number): boolean;
        isBeatFaked(beat: number): boolean;
        getMeasure(beat: number): number;
        getDivisionLength(beat: number): number;
        getMeasureLength(beat: number): number;
        getBeatOfMeasure(beat: number): number;
        getBeatFromMeasure(measure: number): number;
        getDivisionOfMeasure(beat: number): number;
        getMeasureBeats(firstBeat: number, lastBeat: number): Generator<[number, boolean], void>;
        getEffectiveBeat(beat: number): number;
        getBeatFromEffectiveBeat(effBeat: number): number;
        getSpeedMult(beat: number, seconds: number): number;
        reloadCache(types?: TimingType[]): void;
        getBeatTiming(): BeatTimingCache[];
        getTimingData(): Cached<TimingEvent>[];
        getTimingData<Type extends TimingEventType>(...props: Type[]): Cached<Extract<TimingEvent, {
            type: Type;
        }>>[];
        requiresSSC(): boolean;
        destroy(): void;
    }
}
declare module "app/src/chart/gameTypes/base/GameLogic" {
    import { ChartManager } from "app/src/chart/ChartManager";
    import { Notedata, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { TimingData } from "app/src/chart/sm/TimingData";
    export abstract class GameLogic {
        /**
         * Called every frame to update the game logic
         *
         * @abstract
         * @param {ChartManager} chartManager
         * @memberof GameLogic
         */
        abstract update(chartManager: ChartManager): void;
        /**
         * Called when play mode is started.
         *
         * @abstract
         * @param {ChartManager} chartManager
         * @memberof GameLogic
         */
        abstract startPlay(chartManager: ChartManager): void;
        /**
         * Called when a column is pressed down.
         *
         * @abstract
         * @param chartManager
         * @param {number} col
         * @memberof GameLogic
         */
        abstract keyDown(chartManager: ChartManager, col: number): void;
        /**
         * Called when a column is released.
         *
         * @abstract
         * @param chartManager
         * @param {number} col
         * @memberof GameLogic
         */
        abstract keyUp(chartManager: ChartManager, col: number): void;
        /**
         * Determines whether a note should activate assist tick.
         *
         * @abstract
         * @param {NotedataEntry} note
         * @return {*}  {boolean}
         * @memberof GameLogic
         */
        abstract shouldAssistTick(note: NotedataEntry): boolean;
        abstract calculateMaxDP(notedata: Notedata, timingData: TimingData): number;
        abstract usesHoldTicks: boolean;
        abstract comboIsPerRow: boolean;
        abstract missComboIsPerRow: boolean;
    }
}
declare module "app/src/chart/gameTypes/base/NotedataParser" {
    import { PartialNotedata } from "app/src/chart/sm/NoteTypes";
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    export abstract class NotedataParser {
        /**
         * Parses the string into Notedata.
         *
         * @abstract
         * @param {string} data
         * @param gameType
         * @return {*}  {PartialNotedata}
         * @memberof NotedataParser
         */
        abstract fromString(data: string, gameType: GameType): PartialNotedata;
        /**
         * Converts Notedata into SM form.
         *
         * @abstract
         * @param {PartialNotedata} notedata
         * @param {GameType} gameType
         * @return {*}  {string}
         * @memberof NotedataParser
         */
        abstract serialize(notedata: PartialNotedata, gameType: GameType): string;
    }
}
declare module "app/src/util/ColHeldTracker" {
    export class ColHeldTracker {
        private cols;
        keyDown(col: number): void;
        keyUp(col: number): void;
        isPressed(col: number): boolean;
        getHeldCols(): number[];
        reset(): void;
    }
}
declare module "app/src/chart/gameTypes/common/BasicGameLogic" {
    import { ColHeldTracker } from "app/src/util/ColHeldTracker";
    import { ChartManager } from "app/src/chart/ChartManager";
    import { TimingWindowCollection } from "app/src/chart/play/TimingWindowCollection";
    import { HoldNotedataEntry, Notedata, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { GameLogic } from "app/src/chart/gameTypes/base/GameLogic";
    export class BasicGameLogic extends GameLogic {
        protected chordCohesion: Map<number, NotedataEntry[]>;
        protected missNoteIndex: number;
        protected holdProgress: HoldNotedataEntry[];
        protected heldCols: ColHeldTracker;
        protected collection: TimingWindowCollection;
        usesHoldTicks: boolean;
        comboIsPerRow: boolean;
        missComboIsPerRow: boolean;
        update(chartManager: ChartManager): void;
        startPlay(chartManager: ChartManager): void;
        keyDown(chartManager: ChartManager, col: number): void;
        keyUp(chartManager: ChartManager, col: number): void;
        shouldAssistTick(note: NotedataEntry): boolean;
        protected hitNote(chartManager: ChartManager, note: NotedataEntry, hitTime: number): void;
        protected getClosestNote(notedata: Notedata, hitTime: number, col: number, types: string[], windowMS?: number): NotedataEntry | undefined;
        protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean;
        calculateMaxDP(notedata: Notedata, _: TimingData): number;
    }
}
declare module "app/src/chart/gameTypes/common/BasicNotedataParser" {
    import { PartialNotedata } from "app/src/chart/sm/NoteTypes";
    import { NotedataParser } from "app/src/chart/gameTypes/base/NotedataParser";
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    export class BasicNotedataParser extends NotedataParser {
        serialize(notedata: PartialNotedata, gameType: GameType): string;
        fromString(data: string, gameType: GameType): PartialNotedata;
    }
}
declare module "app/src/chart/gameTypes/pump/PumpGameLogic" {
    import { ChartManager } from "app/src/chart/ChartManager";
    import { TimingWindowCollection } from "app/src/chart/play/TimingWindowCollection";
    import { HoldNotedataEntry, Notedata, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { BasicGameLogic } from "app/src/chart/gameTypes/common/BasicGameLogic";
    interface Tick {
        beat: number;
        note: HoldNotedataEntry;
        second: number;
        hit: boolean;
        hitAll: boolean;
    }
    interface HoldTickData {
        ticks: Tick[];
        missIndex: number;
        hitIndex: number;
        activeIndex: number;
    }
    export class PumpGameLogic extends BasicGameLogic {
        protected tickProgress: Map<HoldNotedataEntry, HoldTickData>;
        protected tickCohesion: Map<number, number>;
        protected pendingTicks: Map<number, Tick[]>;
        protected collection: TimingWindowCollection;
        protected holdIndex: number;
        usesHoldTicks: boolean;
        comboIsPerRow: boolean;
        missComboIsPerRow: boolean;
        update(chartManager: ChartManager): void;
        protected hitNote(chartManager: ChartManager, note: NotedataEntry, hitTime: number): void;
        startPlay(chartManager: ChartManager): void;
        keyDown(chartManager: ChartManager, col: number): void;
        protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean;
        protected generateHoldTicks(timingData: TimingData, hold: HoldNotedataEntry): number[];
        calculateMaxDP(notedata: Notedata, timingData: TimingData): number;
    }
}
declare module "app/src/chart/gameTypes/GameTypeRegistry" {
    import { NoteType } from "app/src/chart/sm/NoteTypes";
    import { NotedataParser } from "app/src/chart/gameTypes/base/NotedataParser";
    export interface GameType {
        id: string;
        numCols: number;
        columnWidths: number[];
        notefieldWidth: number;
        columnNames: string[];
        parser: NotedataParser;
        editNoteTypes: NoteType[];
        flipColumns: {
            horizontal: number[];
            vertical: number[];
        };
    }
    export class GameTypeRegistry {
        private static gameTypes;
        private static priority;
        static register(gameType: Omit<GameType, "notefieldWidth">): void;
        static getPriority(): GameType[];
        static getGameType(id: string): GameType | undefined;
        static getTypes(): Record<string, GameType>;
    }
}
declare module "app/src/util/Flags" {
    type BooleanFlags = {
        [K in keyof URLFlags]-?: URLFlags[K] extends boolean ? K : never;
    }[keyof URLFlags];
    export function loadFlags(): void;
    export const FLAG_MAP: Record<BooleanFlags, {
        char: string;
        name: string;
    }>;
    interface URLFlags {
        viewMode: boolean;
        menuBar: boolean;
        playbackOptions: boolean;
        barlines: boolean;
        assist: boolean;
        recordMode: boolean;
        playMode: boolean;
        layout: boolean;
        status: boolean;
        autoPlay: boolean;
        openWindows: boolean;
        hidePoweredByText: boolean;
        url: string | null;
        chartIndex: number | null;
        chartType: string | null;
    }
    export const Flags: URLFlags;
}
declare module "app/src/util/Capture" {
    import { App } from "app/src/App";
    export interface CaptureCallbackData {
        currentRenderFrame: number;
        currentEncodeQueue: number;
        totalFrames: number;
        currentVideoFrame: VideoFrame | null;
    }
    export interface CaptureOptions {
        aspectRatio: number;
        videoHeight: number;
        fps: number;
        bitrate: number;
        playbackRate: number;
        assistTick: boolean;
        metronome: boolean;
        hideBarlines: boolean;
        startTime: number;
        endTime: number;
        updateCallback?: (data: CaptureCallbackData) => Promise<void>;
        onFinish?: (url: string) => void;
    }
    export class Capture {
        private readonly app;
        private readonly options;
        private encoder;
        private ac;
        private muxer?;
        private recording;
        private renderInterval?;
        private cachedBarlines;
        private _currentFrame;
        private blob?;
        readonly totalFrames: number;
        constructor(app: App, options?: Partial<CaptureOptions>);
        renderBufferWithModifications(buffer: AudioBuffer, options: {
            volume: number;
            sampleRate: number;
            rate: number;
        }): Promise<AudioBuffer>;
        createAssistSounds(startTime: number, endTime: number, sampleRate: number, playbackRate: number): Promise<AudioBuffer>;
        start(): Promise<string>;
        stop(): Promise<string>;
        get currentRenderFrame(): number;
        get currentEncodeQueue(): number;
        get size(): number;
    }
}
declare module "app/src/data/CaptureWindowData" {
    import { ValueInput } from "app/src/gui/element/ValueInput";
    import { CaptureOptions } from "app/src/util/Capture";
    export type CaptureWindowOptions<T> = {
        label: string;
        tooltip?: string;
        input: ValueInput<T>;
    };
    export const CAPTURE_WINDOW_VIDEO_OPTIONS: {
        [k in keyof CaptureOptions]?: CaptureWindowOptions<any>;
    };
    export const CAPTURE_WINDOW_VIEW_OPTIONS: {
        [k in keyof CaptureOptions]?: CaptureWindowOptions<any>;
    };
}
declare module "app/src/data/GameplayKeybindData" {
    interface GameplayKeybind {
        label: string;
        keys: string[];
    }
    export const GAMEPLAY_KEYBINDS: {
        [key: string]: GameplayKeybind[];
    };
}
declare module "app/src/util/Keybinds" {
    import { App } from "app/src/App";
    import { KeyCombo, Modifier } from "app/src/data/KeybindData";
    export class Keybinds {
        private static app;
        private static userKeybinds;
        private static userGameplayKeybinds;
        private static enabled;
        static load(app: App): void;
        static checkKey(event: KeyboardEvent, type: "keydown" | "keyup"): void;
        static getKeyNameFromEvent(event: KeyboardEvent): string;
        static getKeybindString(id: string): string;
        static getComboString(combo: KeyCombo): string;
        static getCombosForKeybind(id: string): KeyCombo[];
        static getKeysForGameType(id: string): string[][];
        static compareModifiers(mod1: Modifier[], mod2: Modifier[]): boolean;
        static compareCombos(combo1: KeyCombo, combo2: KeyCombo): boolean;
        static loadKeybinds(): void;
        static clearSave(): void;
        static setKeybind(id: string, combo: KeyCombo): void;
        static removeKeybind(id: string, combo: KeyCombo): void;
        static revertKeybind(id: string): void;
        static revertGameplayKeybind(id: string, col: number): void;
        static setGameplayKeybind(id: string, col: number, key: string): void;
        static removeGameplayKeybind(id: string, col: number, key: string): void;
        static checkIsDefault(id: string): boolean;
        static checkIsDefaultGameplay(id: string, col: number): boolean;
        static saveKeybinds(): void;
        private static getKeybindTooltip;
        private static evaluateTaggedTooltip;
        static createKeybindTooltip(element: Element): (strings: TemplateStringsArray, ...ids: string[]) => void;
        static disableKeybinds(): void;
        static enableKeybinds(): void;
    }
}
declare module "app/src/gui/window/CaptureWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class CaptureWindow extends Window {
        app: App;
        private captureOptions;
        private startBeat;
        private endBeat;
        private presetDropdown;
        private exportButton;
        private optionsView;
        private captureView;
        private captureCanvas;
        private videoContainer;
        private progressLabel;
        private progressBar;
        private currentCapture?;
        private videoURL?;
        private stopButton;
        private returnButton;
        private downloadButton;
        private estimateInterval?;
        private regionHandler;
        constructor(app: App);
        onClose(): void;
        initView(): void;
        initOptionsView(): void;
        initCaptureView(): void;
        startCapture(): void;
        stopCapture(url: string): void;
        private buildBeatSecondInput;
        private updateSizeEstimate;
        private buildOptions;
    }
}
declare module "app/src/gui/window/ChangelogWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export interface CoreVersion {
        version: string;
        date: number;
        changelog: string;
    }
    export class ChangelogWindow extends Window {
        app: App;
        constructor(app: App);
        initView(): void;
    }
}
declare module "app/src/chart/stats/ChartAnalyzer" {
    import { Chart } from "app/src/chart/sm/Chart";
    export abstract class ChartAnalyzer {
        protected readonly chart: Chart;
        constructor(chart: Chart);
        /**
         * Clear any caches used by this analyzer. Timing events that affect timing will trigger the entire chart to be analyzed
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        reset(): void;
        /**
         * Calculate data for the entire chart. This method will be called after reset().
         * @abstract
         * @memberof ChartAnalyzer
         */
        abstract calculateAll(): void;
        /**
         * Recalculate data for the chart for a given range of beats
         *
         * @abstract
         * @param {number} startBeat
         * @param {number} endBeat
         * @memberof ChartAnalyzer
         */
        abstract recalculate(startBeat: number, endBeat: number): void;
        /**
         * Called when the chart is unloaded.
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        onUnload(): void;
        /**
         * Called when the chart is loaded.
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        onLoad(): void;
        /**
         * Called when the chart is destroyed.
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        destroy(): void;
    }
}
declare module "app/src/chart/stats/NoteTypeAnalyzer" {
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    export class NoteTypeAnalyzer extends ChartAnalyzer {
        calculateAll(): void;
        recalculate(): void;
    }
}
declare module "app/src/chart/stats/NPSAnalyzer" {
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    export class NPSAnalyzer extends ChartAnalyzer {
        reset(): void;
        private calculateNPS;
        calculateAll(): void;
        recalculate(startBeat: number, endBeat: number): void;
    }
}
declare module "app/src/chart/stats/parity/ParityUtils" {
    export function doFeetOverlap(oldHeel: number, oldToe: number, newHeel: number, newToe: number): boolean;
    export function getPlayerAngle(left: {
        x: number;
        y: number;
    }, right: {
        x: number;
        y: number;
    }): number;
}
declare module "app/src/chart/stats/parity/StageLayouts" {
    import { ParityState, PlacementData, Row } from "app/src/chart/stats/parity/ParityDataTypes";
    export interface StagePoint {
        x: number;
        y: number;
        rotation: number;
    }
    export class StageLayout {
        name: string;
        layout: StagePoint[];
        columnCount: number;
        upArrows: number[];
        downArrows: number[];
        sideArrows: number[];
        constructor(name: string, layout: StagePoint[], upArrows: number[], downArrows: number[], sideArrows: number[]);
        getFacingDirectionCosine(leftIndex: number, rightIndex: number): number;
        getYDifference(leftIndex: number, rightIndex: number): number;
        averagePoint(leftIndex: number, rightIndex: number): StagePoint | {
            x: number;
            y: number;
        };
        getDistanceSq(leftIndex: number, rightIndex: number): number;
        getDistanceSqPoints(p1: {
            x: number;
            y: number;
        }, p2: {
            x: number;
            y: number;
        }): number;
        bracketCheck(column1: number, column2: number): boolean;
        getPlayerAngle(leftIndex: number, rightIndex: number): number;
        getPlacementData(initialState: ParityState, resultState: ParityState, lastRow: Row, row: Row): PlacementData;
    }
    export const STAGE_LAYOUTS: {
        [id: string]: StageLayout;
    };
}
declare module "app/src/chart/stats/parity/ParityCost" {
    import { ParityState, PlacementData, Row } from "app/src/chart/stats/parity/ParityDataTypes";
    export class ParityCostCalculator {
        private readonly layout;
        private WEIGHTS;
        constructor(type: string, weights?: {
            [key: string]: number;
        } | undefined);
        setWeights(newWeights: {
            [key: string]: number;
        }): void;
        getActionCost(initialState: ParityState, resultState: ParityState, rows: Row[], rowIndex: number): {
            [id: string]: number;
        };
        doesLeftFootOverlapRight(data: PlacementData): boolean;
        doesRightFootOverlapLeft(data: PlacementData): boolean;
        calcMineCosts(data: PlacementData, row: Row): number;
        calcHoldSwitchCosts(data: PlacementData, row: Row): number;
        calcBracketTapCost(data: PlacementData, elapsedTime: number): number;
        calcStartCrossover(data: PlacementData, rowIndex: number): number;
        calcBracketJackCost(data: PlacementData): number;
        calcXOBRCost(data: PlacementData): number;
        calcDoublestepCost(data: PlacementData, lastRow: Row, row: Row, elapsedTime: number): number;
        calcJumpCost(data: PlacementData, elapsedTime: number): number;
        private slowBracketThreshold;
        private slowBracketCap;
        calcSlowBracketCost(data: PlacementData, elapsedTime: number): number;
        calcTwistedFoot(data: PlacementData): number;
        calcFacingCost(data: PlacementData): number;
        calcSpinCost(data: PlacementData): number;
        private SlowFootswitchThreshold;
        private SlowFootswitchIgnore;
        calcSlowFootswitchCost(data: PlacementData, row: Row, elapsedTime: number): number;
        calcSideswitchCost(data: PlacementData): number;
        calcMissedFootswitchCost(data: PlacementData, row: Row): number;
        private JackMaxElapsedTime;
        calcJackCost(data: PlacementData, elapsedTime: number): number;
        calcDistanceCost(data: PlacementData, elapsedTime: number): number;
        calcCrowdedBracketCost(data: PlacementData, elapsedTime: number): number;
    }
}
declare module "app/src/chart/stats/parity/RowStatCalculator" {
    import { Foot, Row, TechCategory, TechErrors } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ParityGraphNode } from "app/src/chart/stats/parity/ParityInternals";
    import { StageLayout } from "app/src/chart/stats/parity/StageLayouts";
    export function calculateRowStats(nodes: ParityGraphNode[], rows: Row[], layout: StageLayout): {
        techRows: (Set<TechCategory> | undefined)[];
        techErrors: Map<number, Set<TechErrors>>;
        facingRows: number[];
        candles: Map<number, Foot>;
        techCounts: number[];
        techErrorCounts: number[];
    };
}
declare module "app/src/chart/stats/parity/ParityInternals" {
    import { Notedata } from "app/src/chart/sm/NoteTypes";
    import { Foot, FootOverride, ParityState, Row } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ParityDebugStats } from "app/src/chart/stats/parity/ParityWebWorkerTypes";
    export class ParityGraphNode {
        children: Map<string, {
            [id: string]: number;
        }>;
        state: ParityState;
        key: string;
        constructor(state: ParityState, key?: string);
    }
    export class ParityInternals {
        private readonly costCalc;
        private readonly layout;
        private readonly initialRow;
        private readonly endRow;
        private readonly initialNode;
        private readonly endNode;
        private cachedEdges;
        private cachedLowestCost;
        edgeCacheSize: number;
        private permuteCache;
        nodeMap: Map<string, ParityGraphNode>;
        private nEdges;
        bestPath?: string[];
        bestPathCost: number;
        bestPathSet?: Set<string>;
        debugStats: ParityDebugStats;
        notedataRows: Row[];
        nodeRows: {
            beat: number;
            nodes: ParityGraphNode[];
        }[];
        constructor(gameType: string);
        compute(startBeat: number, endBeat: number, notedata: Notedata): {
            techRows: (Set<import("app/src/chart/stats/parity/ParityDataTypes").TechCategory> | undefined)[];
            techErrors: Map<number, Set<import("app/src/chart/stats/parity/ParityDataTypes").TechErrors>>;
            facingRows: number[];
            candles: Map<number, Foot>;
            techCounts: number[];
            techErrorCounts: number[];
            parityLabels: Map<string, Foot>;
            states: ParityState[];
            rowTimestamps: {
                beat: number;
                second: number;
            }[];
        } | null;
        recalculateRows(startBeat: number, endBeat: number, notedata: Notedata): {
            startIdx: number;
            newEndIdx: number;
            oldEndIdx: number;
        };
        recalculateStates(updatedRows: {
            startIdx: number;
            newEndIdx: number;
            oldEndIdx: number;
        }): {
            firstUpdatedRow: number;
            lastUpdatedRow: number;
        };
        computeCosts(updatedStates: {
            firstUpdatedRow: number;
            lastUpdatedRow: number;
        }): {
            firstUpdatedCost: number;
            lastUpdatedCost: number;
        };
        computeBestPath(updatedCosts: {
            firstUpdatedCost: number;
            lastUpdatedCost: number;
        }): void;
        calculatePermuteColumnKey(row: Row): string;
        getPossibleActions(row: Row): Foot[][];
        generateActions(row: Row, columns: Foot[], column: number): Foot[][];
        filterActions(row: Row, permuteColumns: Foot[][], overrides: FootOverride[]): Foot[][];
        initResultState(initialState: ParityState, row: Row, action: Foot[]): ParityState;
        rowToKey(row: Row): string;
        private isSameSecond;
        deleteCache(): void;
        reset(): void;
    }
}
declare module "app/src/chart/stats/parity/ParityWebWorkerTypes" {
    import { Notedata } from "app/src/chart/sm/NoteTypes";
    import { Foot, ParityState, Row, TechCategory, TechErrors } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ParityGraphNode } from "app/src/chart/stats/parity/ParityInternals";
    export interface ParityComputeData {
        parityLabels: Map<string, Foot>;
        states: ParityState[];
        rowTimestamps: {
            beat: number;
            second: number;
        }[];
        techRows: (Set<TechCategory> | undefined)[];
        techErrors: Map<number, Set<TechErrors>>;
        techCounts: number[];
        techErrorCounts: number[];
        facingRows: number[];
        candles: Map<number, Foot>;
    }
    export type ParityDebugUpdateData = {
        removedRowsStart: number;
        removedRowsEnd: number;
        newRows: Row[];
        newStates: {
            beat: number;
            nodes: ParityGraphNode[];
        }[];
        bestPath: string[];
        bestPathCost: number;
        bestPathSet: Set<string>;
        edgeCacheSize: number;
        stats: ParityDebugStats;
    };
    export type ParityDebugData = {
        edgeCacheSize: number;
        nodeMap: Map<string, ParityGraphNode>;
        bestPath: string[];
        bestPathCost: number;
        bestPathSet: Set<string>;
        notedataRows: Row[];
        nodeRows: {
            beat: number;
            nodes: ParityGraphNode[];
        }[];
        stats: ParityDebugStats;
    };
    export type ParityDebugStats = {
        lastUpdatedRowStart: number;
        lastUpdatedOldRowEnd: number;
        lastUpdatedRowEnd: number;
        rowUpdateTime: number;
        lastUpdatedNodeStart: number;
        lastUpdatedNodeEnd: number;
        nodeUpdateTime: number;
        createdNodes: number;
        createdEdges: number;
        calculatedEdges: number;
        cachedEdges: number;
        edgeUpdateTime: number;
        cachedBestRows: number;
        pathUpdateTime: number;
        rowStatsUpdateTime: number;
    };
    export interface ParityBaseMessage {
        id: number;
    }
    export interface ParityInboundInitMessage extends ParityBaseMessage {
        type: "init";
        gameType: string;
    }
    export interface ParityOutboundInitMessage extends ParityBaseMessage {
        type: "init";
    }
    export interface ParityInboundComputeMessage extends ParityBaseMessage {
        type: "compute";
        startBeat: number;
        endBeat: number;
        notedata: Notedata;
        debug: boolean;
    }
    export interface ParityOutboundComputeMessage extends ParityBaseMessage {
        type: "compute";
        data: ParityComputeData;
        debug?: ParityDebugUpdateData;
    }
    export interface ParityInboundGetDebugMessage extends ParityBaseMessage {
        type: "getDebug";
    }
    export interface ParityOutboundErrorMessage extends ParityBaseMessage {
        type: "error";
        error: string;
    }
    export interface ParityOutboundGetDebugMessage extends ParityBaseMessage {
        type: "getDebug";
        data: ParityDebugData | null;
    }
    export type ParityInboundMessage = ParityInboundInitMessage | ParityInboundComputeMessage | ParityInboundGetDebugMessage;
    export type ParityOutboundMessage = ParityOutboundInitMessage | ParityOutboundComputeMessage | ParityOutboundGetDebugMessage | ParityOutboundErrorMessage;
}
declare module "app/src/chart/stats/parity/ParityAnalyzer" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    import { ParityInboundMessage, ParityOutboundMessage } from "app/src/chart/stats/parity/ParityWebWorkerTypes";
    export class ParityAnalyzer extends ChartAnalyzer {
        worker?: Worker;
        active: boolean;
        disabled: boolean;
        private pendingJobs;
        private messageId;
        private eventHandler;
        constructor(chart: Chart);
        recalculate(startBeat: number, endBeat: number): void;
        calculateAll(): void;
        workerCalculate(startBeat: number, endBeat: number): void;
        onLoad(): Promise<void>;
        onUnload(): void;
        reset(): void;
        destroy(): void;
        initializeWorker(): Promise<void>;
        terminateWorker(): void;
        postMessage<Message extends Omit<ParityInboundMessage, "id">>(message: Message): Promise<Extract<ParityOutboundMessage, {
            type: Message["type"];
        }>>;
    }
}
declare module "app/src/chart/stats/StreamAnalyzer" {
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    export interface StreamData {
        startBeat: number;
        endBeat: number;
        streamSpacing: number | null;
    }
    export class StreamAnalyzer extends ChartAnalyzer {
        reset(): void;
        private generateStreams;
        calculateAll(): void;
        recalculate(startBeat: number, endBeat: number): void;
    }
}
declare module "app/src/chart/stats/ChartStats" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { ParityComputeData, ParityDebugData } from "app/src/chart/stats/parity/ParityWebWorkerTypes";
    import { StreamData } from "app/src/chart/stats/StreamAnalyzer";
    export class ChartStats {
        noteCounts: Record<string, number>;
        npsGraph: number[];
        streams: StreamData[];
        parity?: ParityComputeData & {
            debug: ParityDebugData;
            debugTime: number;
        };
        readonly chart: Chart;
        private analyzers;
        private lastUpdate;
        private queued;
        private loaded;
        private readonly loadHandler;
        constructor(chart: Chart);
        calculate(): void;
        private _recalculate;
        recalculate(startBeat: number, endBeat: number): void;
        reset(): void;
        getMaxNPS(): number;
        destroy(): void;
    }
}
declare module "app/src/chart/sm/ChartTypes" {
    export const CHART_DIFFICULTIES: readonly ChartDifficulty[];
    export type ChartDifficulty = "Beginner" | "Easy" | "Medium" | "Hard" | "Challenge" | "Edit";
}
declare module "app/src/chart/sm/SimfileTypes" {
    export const SIMFILE_PROPERTIES: readonly ["TITLE", "SUBTITLE", "ARTIST", "TITLETRANSLIT", "SUBTITLETRANSLIT", "ARTISTTRANSLIT", "GENRE", "CREDIT", "ORIGIN", "BACKGROUND", "BANNER", "MUSIC", "CDTITLE", "JACKET", "DISCIMAGE", "CDIMAGE", "PREVIEW", "LYRICSPATH", "SAMPLESTART", "SAMPLELENGTH", "SELECTABLE"];
    export type SimfileProperty = (typeof SIMFILE_PROPERTIES)[number];
}
declare module "app/src/chart/sm/SMETypes" {
    import { FootOverride } from "app/src/chart/stats/parity/ParityDataTypes";
    export type SMEData = {
        version: number;
        parity: Record<string, SMEParityData[]>;
    };
    export type SMEParityData = {
        overrides: [number, number, FootOverride][];
        ignores: Record<number, string[]>;
    };
}
declare module "app/src/chart/sm/SMEParser" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { Simfile } from "app/src/chart/sm/Simfile";
    import { SMEParityData } from "app/src/chart/sm/SMETypes";
    export function serializeSMEData(sm: Simfile): string;
    export function getParityData(chart: Chart): SMEParityData;
    export function loadSMEData(string: string, sm: Simfile, isAutosave: boolean): void;
    export function loadChartParityData(data: SMEParityData, chart: Chart): void;
}
declare module "app/src/chart/sm/Simfile" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { SimfileProperty } from "app/src/chart/sm/SimfileTypes";
    import { SongTimingData } from "app/src/chart/sm/SongTimingData";
    export class Simfile {
        charts: Record<string, Chart>;
        _type?: "sm" | "ssc";
        other_properties: {
            [key: string]: string;
        };
        properties: {
            [key in SimfileProperty]?: string;
        };
        timingData: SongTimingData;
        unloadedCharts: (string | {
            [key: string]: string;
        })[];
        loaded: Promise<void>;
        constructor(file: File, dataFile?: File);
        addChart(chart: Chart): void;
        private createChartID;
        removeChart(chart: Chart): boolean;
        getChartsByGameType(gameType: string): Chart[];
        getAllChartsByGameType(): Record<string, Chart[]>;
        serialize(type: "sm" | "ssc" | "smebak"): string;
        usesChartTiming(): boolean;
        requiresSSC(): boolean;
        recalculateAllStats(): void;
        private formatProperty;
        destroy(): void;
    }
}
declare module "app/src/chart/sm/SongTimingData" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { ChartTimingData } from "app/src/chart/sm/ChartTimingData";
    import { Simfile } from "app/src/chart/sm/Simfile";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { TimingEventType, TimingType } from "app/src/chart/sm/TimingTypes";
    export class SongTimingData extends TimingData {
        protected offset: number;
        protected chartTimingDatas: ChartTimingData[];
        protected sm: Simfile;
        constructor(simfile: Simfile);
        protected callListeners(modifiedEvents?: {
            type: TimingEventType;
        }[]): void;
        createChartTimingData(chart: Chart): ChartTimingData;
        getColumn<Type extends TimingEventType>(type: Type): NonNullable<{
            BPMS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").BPMTimingEvent> | undefined;
            STOPS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").StopTimingEvent> | undefined;
            WARPS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").WarpTimingEvent> | undefined;
            DELAYS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").DelayTimingEvent> | undefined;
            LABELS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").LabelTimingEvent> | undefined;
            SPEEDS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").SpeedTimingEvent> | undefined;
            SCROLLS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").ScrollTimingEvent> | undefined;
            TICKCOUNTS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").TickCountTimingEvent> | undefined;
            TIMESIGNATURES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").TimeSignatureTimingEvent> | undefined;
            COMBOS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").ComboTimingEvent> | undefined;
            FAKES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").FakeTimingEvent> | undefined;
            ATTACKS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").AttackTimingEvent> | undefined;
            BGCHANGES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").BGChangeTimingEvent> | undefined;
            FGCHANGES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").FGChangeTimingEvent> | undefined;
        }[Type]>;
        getOffset(): number;
        reloadCache(types?: TimingType[]): void;
        _setOffset(offset: number): void;
    }
}
declare module "app/src/chart/sm/ChartTimingData" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { SongTimingData } from "app/src/chart/sm/SongTimingData";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { DeletableEvent, TimingEvent, TimingEventType, TimingType } from "app/src/chart/sm/TimingTypes";
    export class ChartTimingData extends TimingData {
        readonly songTimingData: SongTimingData;
        private readonly chart;
        constructor(simfileTimingData: SongTimingData, chart: Chart);
        protected callListeners(modifiedEvents?: {
            type: TimingEventType;
        }[]): void;
        getColumn<Type extends TimingEventType>(type: Type): NonNullable<{
            BPMS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").BPMTimingEvent> | undefined;
            STOPS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").StopTimingEvent> | undefined;
            WARPS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").WarpTimingEvent> | undefined;
            DELAYS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").DelayTimingEvent> | undefined;
            LABELS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").LabelTimingEvent> | undefined;
            SPEEDS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").SpeedTimingEvent> | undefined;
            SCROLLS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").ScrollTimingEvent> | undefined;
            TICKCOUNTS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").TickCountTimingEvent> | undefined;
            TIMESIGNATURES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").TimeSignatureTimingEvent> | undefined;
            COMBOS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").ComboTimingEvent> | undefined;
            FAKES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").FakeTimingEvent> | undefined;
            ATTACKS?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").AttackTimingEvent> | undefined;
            BGCHANGES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").BGChangeTimingEvent> | undefined;
            FGCHANGES?: import("app/src/chart/sm/TimingTypes").TimingColumn<import("app/src/chart/sm/TimingTypes").FGChangeTimingEvent> | undefined;
        }[Type]>;
        getOffset(): number;
        usesChartTiming(): boolean;
        hasChartOffset(): boolean;
        isPropertyChartSpecific(type: TimingEventType): boolean;
        copyOffsetToSimfile(): void;
        removeChartOffset(): void;
        copyAllToSimfile(): void;
        copyColumnsToSimfile(columns: TimingEventType[]): void;
        copyColumnsFromSimfile(columns: TimingEventType[]): void;
        copyAllFromSimfile(): void;
        createChartColumns(columns: TimingEventType[]): void;
        createEmptyData(): void;
        deleteColumns(columns: TimingEventType[]): void;
        deleteAllChartSpecific(): void;
        reloadCache(types?: TimingType[]): void;
        private splitSM;
        private splitSMPairs;
        insertColumnEvents(events: TimingEvent[]): void;
        modifyColumnEvents(events: [TimingEvent, TimingEvent][]): void;
        deleteColumnEvents(events: DeletableEvent[]): void;
    }
}
declare module "app/src/chart/sm/Chart" {
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    import { ChartStats } from "app/src/chart/stats/ChartStats";
    import { ChartTimingData } from "app/src/chart/sm/ChartTimingData";
    import { ChartDifficulty } from "app/src/chart/sm/ChartTypes";
    import { Notedata, NotedataEntry, PartialNotedata, PartialNotedataEntry, RowData } from "app/src/chart/sm/NoteTypes";
    import { Simfile } from "app/src/chart/sm/Simfile";
    export class Chart {
        readonly sm: Simfile;
        readonly stats: ChartStats;
        private notedata;
        private notedataRows;
        gameType: GameType;
        timingData: ChartTimingData;
        description: string;
        difficulty: ChartDifficulty;
        meter: number;
        meterF: number;
        radarValues: string;
        chartName: string;
        chartStyle: string;
        credit: string;
        music?: string;
        other_properties: {
            [key: string]: string;
        };
        private _lastBeat;
        private _lastSecond;
        private _startModify;
        private _endModify;
        constructor(sm: Simfile, data?: string | {
            [key: string]: string;
        });
        getLastBeat(): number;
        getLastSecond(): number;
        getSecondsFromBeat(beat: number, option?: "noclamp" | "before" | "after" | ""): number;
        getBeatFromSeconds(seconds: number): number;
        getBeatFromEffectiveBeat(effBeat: number): number;
        isBeatWarped(beat: number): boolean;
        isBeatFaked(beat: number): boolean;
        private recalculateLastNote;
        private getNoteIndex;
        private insertNote;
        private addEditRange;
        private callEventListeners;
        private markRecalculateAll;
        addNote(note: PartialNotedataEntry, callListeners?: boolean): NotedataEntry;
        addNotes(notes: PartialNotedataEntry[], callListeners?: boolean): NotedataEntry[];
        computeNote(note: PartialNotedataEntry): NotedataEntry;
        modifyNote(note: PartialNotedataEntry, properties: Partial<NotedataEntry>, callListeners?: boolean): void;
        removeNote(note: PartialNotedataEntry, callListeners?: boolean): NotedataEntry | undefined;
        removeNotes(notes: PartialNotedataEntry[], callListeners?: boolean): NotedataEntry[];
        setNotedata(notedata: PartialNotedata): void;
        getNotedata(): Notedata;
        getRows(): RowData[];
        /**
         * Returns all notes within the given range (inclusive)
         *
         * @param {number} startBeat
         * @param {number} endBeat
         * @return {*}  {Notedata}
         * @memberof Chart
         */
        getNotedataInRange(startBeat: number, endBeat: number): Notedata;
        /**
         * Returns all rows within the given range (inclusive)
         *
         * @param {number} startBeat
         * @param {number} endBeat
         * @return {*}  {RowData[]}
         * @memberof Chart
         */
        getRowsInRange(startBeat: number, endBeat: number): RowData[];
        recalculateNotes(): void;
        recalculateRows(startBeat?: number | null, endBeat?: number | null): void;
        getMusicPath(): string;
        toString(): string;
        serialize(type: "sm" | "ssc" | "smebak"): string;
        requiresSSC(): boolean;
        getColumnCount(): number;
    }
}
declare module "app/src/util/file-handler/URLFileHandler" {
    import { BaseFileHandler } from "app/src/util/file-handler/FileHandler";
    export class URLFileHandler implements BaseFileHandler {
        handleDropEvent(_: DragEvent, _2?: string): Promise<undefined>;
        getDirectoryHandle(_: string, _2?: FileSystemGetFileOptions, _3?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | undefined>;
        hasFile(path: string): Promise<boolean>;
        getFileHandle(path: string, _?: FileSystemGetFileOptions): Promise<FileSystemFileHandle | undefined>;
        getFileHandleRelativeTo(songPath: string, fileName: string): Promise<FileSystemFileHandle | undefined>;
        getDirectoryFiles(_: FileSystemDirectoryHandle | string): Promise<FileSystemFileHandle[]>;
        getDirectoryFolders(_: FileSystemDirectoryHandle | string): Promise<FileSystemDirectoryHandle[]>;
        writeFile(_: FileSystemFileHandle | string, _2: File | string): Promise<void>;
        removeFile(_: string): Promise<void>;
        getRelativePath(_: string, _2: string): string;
        resolvePath(): string;
    }
}
declare module "app/src/util/file-handler/SafariFileWriter" {
    export class SafariFileWriter {
        private static worker;
        private static workID;
        private static map;
        static writeHandle(path: string, data: Blob | string): Promise<void>;
    }
}
declare module "app/src/util/file-handler/WebFileHandler" {
    import JSZip from "jszip";
    import { BaseFileHandler } from "app/src/util/file-handler/FileHandler";
    export class WebFileHandler implements BaseFileHandler {
        private _root;
        private getRoot;
        uploadHandle(handle: FileSystemFileHandle | FileSystemDirectoryHandle, base?: FileSystemDirectoryHandle | string): Promise<void>;
        uploadFiles(item: FileSystemEntry, base?: FileSystemDirectoryHandle | string): Promise<void>;
        handleDropEvent(event: DragEvent, prefix?: string): Promise<string | undefined>;
        uploadDir(dir: FileSystemDirectoryHandle, base?: FileSystemDirectoryHandle | string): Promise<void>;
        getDirectoryHandle(path: string, options?: FileSystemGetFileOptions, dir?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | undefined>;
        hasFile(path: string): Promise<boolean>;
        getFileHandle(path: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle | undefined>;
        getFileHandleRelativeTo(songPath: string, fileName: string): Promise<FileSystemFileHandle | undefined>;
        getDirectoryFiles(path: FileSystemDirectoryHandle | string): Promise<FileSystemFileHandle[]>;
        getDirectoryFolders(path: FileSystemDirectoryHandle | string): Promise<FileSystemDirectoryHandle[]>;
        writeFile(path: FileSystemFileHandle | string, data: File | string): Promise<void>;
        removeFile(path: string, options?: FileSystemRemoveOptions): Promise<void>;
        removeDirectory(path: string): Promise<void>;
        remove(path: string): Promise<void>;
        resolvePath(...path: string[]): string;
        zipDirectory(path: string, folderZip?: JSZip): Promise<JSZip | undefined>;
        saveDirectory(path: string): Promise<void>;
        renameFile(path: string, pathTo: string): Promise<void>;
        renameDirectory(path: string, pathTo: string): Promise<void>;
        copyToHandle(directory: FileSystemDirectoryHandle, handle: FileSystemDirectoryHandle | FileSystemFileHandle, name?: string): Promise<void>;
        getRelativePath(from: string, to: string): string;
        private writeHandle;
    }
}
declare module "app/src/util/file-handler/NodeFileHandler" {
    import { BaseFileHandler } from "app/src/util/file-handler/FileHandler";
    export class NodeFileHandler implements BaseFileHandler {
        handleDropEvent(event: DragEvent, _prefix?: string): Promise<string>;
        getDirectoryHandle(path: string, options?: FileSystemGetFileOptions): Promise<FileSystemDirectoryHandle | undefined>;
        hasFile(path: string): Promise<boolean>;
        getFileHandle(path: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle | undefined>;
        getFileHandleRelativeTo(songPath: string, fileName: string): Promise<FileSystemFileHandle | undefined>;
        getDirectoryFiles(path: FileSystemDirectoryHandle | string): Promise<FileSystemFileHandle[]>;
        getDirectoryFolders(path: FileSystemDirectoryHandle | string): Promise<FileSystemDirectoryHandle[]>;
        writeFile(path: FileSystemFileHandle | string, data: File | string): Promise<void>;
        removeFile(path: string): Promise<void>;
        private writeHandle;
        getRelativePath(from: string, to: string): string;
        resolvePath(...parts: string[]): string;
    }
}
declare module "app/src/util/file-handler/FileHandler" {
    export interface BaseFileHandler {
        handleDropEvent(event: DragEvent, prefix?: string): Promise<string | undefined>;
        getDirectoryHandle(path: string, options?: FileSystemGetFileOptions): Promise<FileSystemDirectoryHandle | undefined>;
        hasFile(path: string): Promise<boolean>;
        getFileHandle(path: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle | undefined>;
        getFileHandleRelativeTo(songPath: string, fileName: string): Promise<FileSystemFileHandle | undefined>;
        getDirectoryFiles(path: FileSystemDirectoryHandle | string): Promise<FileSystemFileHandle[]>;
        getDirectoryFolders(path: FileSystemDirectoryHandle | string): Promise<FileSystemDirectoryHandle[]>;
        writeFile(path: FileSystemFileHandle | string, data: File | string): Promise<void>;
        removeFile(path: FileSystemFileHandle | string): Promise<void>;
        getRelativePath(from: string, to: string): string;
        resolvePath(...parts: string[]): string;
    }
    export class FileHandler {
        private static standardHandler?;
        private static urlHandler?;
        static initFileSystem(): Promise<void>;
        static getStandardHandler(): BaseFileHandler | undefined;
        private static getHandler;
        static handleDropEvent(event: DragEvent, prefix?: string): Promise<string | undefined>;
        static getDirectoryHandle(path: string, options?: FileSystemGetFileOptions): Promise<FileSystemDirectoryHandle | undefined>;
        static hasFile(path: string): Promise<boolean>;
        static getFileHandle(path: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle | undefined>;
        static getFileHandleRelativeTo(songPath: string, fileName: string): Promise<FileSystemFileHandle | undefined>;
        static getDirectoryFiles(path: FileSystemDirectoryHandle | string): Promise<FileSystemFileHandle[]>;
        static getDirectoryFolders(path: FileSystemDirectoryHandle | string): Promise<FileSystemDirectoryHandle[]>;
        static writeFile(path: FileSystemFileHandle | string, data: File | string): Promise<void>;
        static removeFile(path: string): Promise<void>;
        static getRelativePath(from: string, to: string): string;
    }
}
declare module "app/src/gui/window/DirectoryWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    interface DirectoryWindowOptions {
        title: string;
        accepted_file_types?: string[];
        callback?: (path: string) => void;
        onload?: () => void;
        disableClose?: boolean;
    }
    export class DirectoryWindow extends Window {
        app: App;
        dirOptions: DirectoryWindowOptions;
        private fileDropPath;
        private draggedElement?;
        private draggedCopy?;
        private readonly keyHandler;
        private readonly dropHandler;
        private readonly mouseHandler;
        private readonly dragHandler;
        constructor(app: App, options: DirectoryWindowOptions, selectedPath?: string);
        initView(): Promise<void>;
        private expand;
        private collapse;
        private selectElement;
        private createDiv;
        private createBaseElement;
        private confirmFile;
        private acceptableFileType;
        private getIconId;
        private startEditing;
        private refreshDirectory;
        private getElement;
        getAcceptableFile(path: string): Promise<string | undefined>;
        selectPath(path: string | undefined): Promise<void>;
        private handleKeyEvent;
        private startDragging;
        private handleDragEvent;
        private stopDragging;
        private handleDropEvent;
        private handleMouseEvent;
        private escapeSelector;
    }
}
declare module "app/src/data/ChartListWindowData" {
    import { App } from "app/src/App";
    import { Chart } from "app/src/chart/sm/Chart";
    type ChartPropertyEditor = {
        title: string;
        element: (chart: Chart, app: App) => HTMLElement;
    };
    export const CHART_PROPERTIES_DATA: {
        [key: string]: ChartPropertyEditor;
    };
}
declare module "app/src/gui/window/ChartListWindow" {
    import { App } from "app/src/App";
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    import { Window } from "app/src/gui/window/Window";
    export class ChartListWindow extends Window {
        app: App;
        gameType: GameType;
        private chartList?;
        private chartInfo?;
        private gameTypeDropdown?;
        private currentChart?;
        private smLoadHandler;
        private chartModifiedHandler;
        constructor(app: App, gameType?: GameType);
        initView(): void;
        onClose(): void;
        private loadCharts;
        private loadChartDetails;
        private getCharts;
    }
}
declare module "app/src/util/custom-script/CustomScriptTypes" {
    import { KeyCombo } from "app/src/data/KeybindData";
    export interface CustomScript {
        name: string;
        description: string;
        jsCode: string;
        tsCode: string;
        arguments: CustomScriptArgument[];
        keybinds: KeyCombo[];
    }
    export interface CustomScriptWorkerArgs {
        smPayload: string;
        codePayload: string;
        chartId: string;
        selectionNoteIndices: number[];
        args: any[];
    }
    export type CustomScriptArgument = CustomScriptCheckboxArgument | CustomScriptColorArgument | CustomScriptNumberArgument | CustomScriptTextArgument | CustomScriptDropdownArgument | CustomScriptSliderArgument;
    interface CustomScriptBaseArgument {
        name: string;
        description: string;
    }
    export interface CustomScriptCheckboxArgument extends CustomScriptBaseArgument {
        type: "checkbox";
        default: boolean;
    }
    export interface CustomScriptColorArgument extends CustomScriptBaseArgument {
        type: "color";
        default: string;
    }
    export interface CustomScriptNumberArgument extends CustomScriptBaseArgument {
        type: "number";
        default: number;
        min?: number;
        max?: number;
        step?: number;
        precision?: number;
        minPrecision?: number;
    }
    export interface CustomScriptTextArgument extends CustomScriptBaseArgument {
        type: "text";
        default: string;
    }
    export interface CustomScriptDropdownArgument extends CustomScriptBaseArgument {
        type: "dropdown";
        items: (string | number)[];
        default: string | number;
    }
    export interface CustomScriptSliderArgument extends CustomScriptBaseArgument {
        type: "slider";
        default: number;
        min: number;
        max: number;
    }
    interface CustomScriptPayload {
        type: "payload";
        payload: string;
    }
    interface CustomScriptLog {
        type: "error" | "log" | "warn" | "info";
        args: string[];
    }
    export type CustomScriptResult = CustomScriptPayload | CustomScriptLog;
}
declare module "app/src/data/CustomScriptWindowData" {
    import { ValueInput } from "app/src/gui/element/ValueInput";
    import { CustomScriptArgument } from "app/src/util/custom-script/CustomScriptTypes";
    type CustomScriptInput<T, U extends CustomScriptArgument> = Omit<ValueInput<T>, "onChange"> & {
        onChange: (argument: U, value: T) => void;
    };
    interface CustomScriptArgumentField<T, U extends CustomScriptArgument> {
        name: string;
        description?: string;
        input: CustomScriptInput<T, U> | ((arg: U) => CustomScriptInput<T, U>);
        reload?: boolean;
        getValue: (arg: U) => any;
    }
    export const ARGUMENT_FIELDS: {
        [Type in CustomScriptArgument["type"]]: CustomScriptArgumentField<any, Extract<CustomScriptArgument, {
            type: Type;
        }>>[];
    };
    export const DEFAULT_ARGUMENTS: {
        [Type in CustomScriptArgument["type"]]: Extract<CustomScriptArgument, {
            type: Type;
        }>;
    };
}
declare module "app/src/util/custom-script/CustomScriptEditor" {
    import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";
    import "monaco-editor/esm/vs/editor/editor.all.js";
    import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
    export type CustomEditor = ReturnType<typeof createEditor>;
    export function createEditor(parent: HTMLElement, value: string, theme: "light" | "dark"): {
        transpile: () => Promise<string>;
        getTS: () => string;
        setJS: (code: string) => void;
        swapTheme(theme: "light" | "dark"): void;
        destroy: () => void;
    };
}
declare module "app/src/util/custom-script/CustomScripts" {
    import { CustomScript } from "app/src/util/custom-script/CustomScriptTypes";
    export class CustomScripts {
        static _scripts: CustomScript[];
        static get scripts(): CustomScript[];
        static loadCustomScripts(): void;
        static saveCustomScripts(): void;
    }
}
declare module "app/src/gui/window/CustomScriptEditorWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class CustomScriptEditorWindow extends Window {
        app: App;
        private scriptList?;
        private scriptData?;
        private currentScript?;
        private currentEditor?;
        constructor(app: App);
        onClose(): void;
        initView(): void;
        private loadScripts;
        private loadScriptDetails;
        private createArgumentsTab;
        private buildArgumentEditor;
        private createEditorTab;
    }
}
declare module "app/src/util/BezierEasing" {
    import bezier from "bezier-easing";
    export type BezierKeyFrames = {
        [key: string]: {
            [key: string]: number | string;
        };
    };
    export interface BezierAnimation<T> {
        obj: T;
        animation: BezierKeyFrames;
        seconds: number;
        progress: number;
        curve: bezier.EasingFunction;
        onend: (obj: T) => void;
    }
    export class BezierAnimator {
        private static animations;
        private static _id;
        static updateObject(obj: any, animation: BezierKeyFrames, time: number): void;
        static stop(id: string | undefined, time?: null | number): void;
        static finish(id: string | undefined): void;
        static animate(obj: any, animation: BezierKeyFrames, seconds: number, curve?: bezier.EasingFunction, onend?: () => void, id?: string): string;
    }
}
declare module "app/src/gui/window/EQWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class EQWindow extends Window {
        app: App;
        private cachedReponse;
        private onAudioLoad;
        private onThemeChange;
        private points;
        private icons;
        private info;
        private trackedFilter;
        constructor(app: App);
        destroy(): void;
        initView(): void;
        private selectText;
        private setupInput;
        onAudio(): void;
        getResponse(): void;
        drawEQ(canvas: HTMLCanvasElement): () => void;
        drawFrequencies(ctx: CanvasRenderingContext2D, data: Uint8Array): void;
        drawResponse(ctx: CanvasRenderingContext2D): void;
        drawGrid(ctx: CanvasRenderingContext2D): void;
        changeHTMLColors(): void;
        updateIcons(): void;
        trackFilter(index: number): void;
        endTrack(): void;
    }
}
declare module "app/src/gui/window/ExportNotedataWindow" {
    import { App } from "app/src/App";
    import { Notedata } from "app/src/chart/sm/NoteTypes";
    import { Window } from "app/src/gui/window/Window";
    export class ExportNotedataWindow extends Window {
        app: App;
        private selection;
        private outputDiv?;
        private exportOptions;
        constructor(app: App, selection?: Notedata);
        initView(): void;
        private export;
        private getNumIncludes;
        private padNum;
    }
}
declare module "app/src/gui/window/KeyComboWindow" {
    import { App } from "app/src/App";
    import { KeyCombo } from "app/src/data/KeybindData";
    import { Window } from "app/src/gui/window/Window";
    export class KeyComboWindow extends Window {
        app: App;
        private readonly allowMods;
        private readonly callback;
        private combo;
        private readonly conflictCheck;
        private listener?;
        static active: boolean;
        constructor(app: App, allowMods: boolean, callback: (combo: KeyCombo) => void, conflictCheck?: (combo: KeyCombo) => string[] | "self");
        initView(): void;
        onClose(): void;
    }
}
declare module "app/src/gui/window/GameplayKeybindWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class GameplayKeybindWindow extends Window {
        app: App;
        private observer?;
        private conflictMap;
        constructor(app: App);
        initView(): void;
        private createSections;
        private createOptions;
        private createEmptySection;
        private createKeybindItem;
        private calculateConflicts;
        onClose(): void;
    }
}
declare module "app/src/util/RecentFileHandler" {
    import { Simfile } from "app/src/chart/sm/Simfile";
    interface RecentFileEntry {
        name: string;
        path: string;
    }
    export class RecentFileHandler {
        private static _model?;
        private static getModel;
        private static _load;
        static getRecents(): Promise<RecentFileEntry[]>;
        static addSM(path: string, sm: Simfile): Promise<void>;
        private static limitEntries;
        private static saveEntries;
    }
}
declare module "app/src/data/SMData" {
    export const DEFAULT_SM = "#TITLE:New Song;\n#SUBTITLE:;\n#ARTIST:;\n#TITLETRANSLIT:;\n#SUBTITLETRANSLIT:;\n#ARTISTTRANSLIT:;\n#GENRE:;\n#CREDIT:;\n#BANNER:;\n#BACKGROUND:;\n#LYRICSPATH:;\n#CDTITLE:;\n#MUSIC:;\n#OFFSET:0;\n#SAMPLESTART:0.000000;\n#SAMPLELENGTH:10.000000;\n#SELECTABLE:YES;\n#BPMS:0.000=120.000;\n#STOPS:;\n#WARPS:;\n#DELAYS:;\n#SPEEDS:0.000=1.000=0.000=0;\n#SCROLLS:0.000=1.000;\n#TICKCOUNTS:;\n#TIMESIGNATURES:0.000000=4=4;\n#LABELS:;\n#COMBOS:;\n#BGCHANGES:;\n#FGCHANGES:;\n#KEYSOUNDS:;\n#ATTACKS:;\n";
}
declare module "app/src/data/SMPropertiesData" {
    import { App } from "app/src/App";
    import { Simfile } from "app/src/chart/sm/Simfile";
    import { SimfileProperty } from "app/src/chart/sm/SimfileTypes";
    import { ActionHistory } from "app/src/util/ActionHistory";
    type SMPropertyGroupData = {
        title: string;
        items: SMPropertyData[];
    };
    type SMPropertyCustomInput = {
        type: "custom";
        create: (app: App, sm: Simfile, history: ActionHistory) => HTMLElement;
    };
    type SMPropertyStringInput = {
        type: "string";
    };
    type SMPropertyFileInput = {
        type: "file";
        typeName: string;
        accept: string[];
        onChange?: (app: App) => void;
    };
    type SMPropertyNumberInput = {
        type: "number";
        step?: number;
        precision?: number;
        min?: number;
        max?: number;
    };
    type SMPropertyInput = SMPropertyStringInput | SMPropertyFileInput | SMPropertyNumberInput | SMPropertyCustomInput;
    type SMPropertyData = {
        title: string;
        propName: SimfileProperty;
        input: SMPropertyInput;
    };
    export const SM_PROPERTIES_DATA: SMPropertyGroupData[];
    export function createInputElement(app: App, sm: Simfile, history: ActionHistory, data: SMPropertyData): HTMLElement;
}
declare module "app/src/gui/window/NewSongWindow" {
    import { App } from "app/src/App";
    import { SimfileProperty } from "app/src/chart/sm/SimfileTypes";
    import { Window } from "app/src/gui/window/Window";
    export class NewSongWindow extends Window {
        app: App;
        private readonly sm;
        private readonly history;
        private fileTable;
        constructor(app: App);
        initView(): void;
        createSong(): Promise<void>;
        createFileElement(propName: SimfileProperty, typeName: string): HTMLDivElement;
    }
}
declare module "app/src/gui/window/InitialWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class InitialWindow extends Window {
        app: App;
        private readonly keyHandler;
        constructor(app: App, disableClose?: boolean);
        onClose(): void;
        initView(): void;
        private handleKeyEvent;
    }
}
declare module "app/src/data/MenubarData" {
    import { App } from "app/src/App";
    export interface MenuSelection {
        type: "selection";
        id: string;
    }
    export interface MenuCheckbox {
        type: "checkbox";
        id: string;
        checked: boolean | ((app: App) => boolean);
    }
    export interface MenuMain {
        type: "menu";
        title: string;
        options: MenuOption[];
    }
    export interface MenuDropdown {
        type: "dropdown";
        title: string | ((app: App) => string);
        options: MenuOption[];
    }
    export interface MenuSeparator {
        type: "separator";
    }
    export type MenuOption = MenuSelection | MenuCheckbox | MenuMain | MenuDropdown | MenuSeparator;
    export const MENUBAR_DATA: {
        [key: string]: MenuMain;
    };
}
declare module "app/src/gui/window/KeybindWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class KeybindWindow extends Window {
        private static GROUPS;
        app: App;
        private observer?;
        private searchDropdown?;
        private conflictMap;
        constructor(app: App);
        initView(): void;
        private createSections;
        private createOptions;
        private static createGroups;
        private filterID;
        private static expandMenubarOptions;
        private createEmptySection;
        private createKeybindItem;
        private calculateConflicts;
        onClose(): void;
    }
}
declare module "app/src/gui/element/ContextMenu" {
    import { FederatedMouseEvent } from "pixi.js";
    import { App } from "app/src/App";
    export class ContextMenuPopup {
        private static menuElement;
        private static closeTimeout;
        static open(app: App, event: MouseEvent | FederatedMouseEvent): void;
        private static fitContextMenu;
        static close(): void;
        private static buildMenu;
        private static createElement;
    }
}
declare module "app/src/util/PixiUtil" {
    import { DisplayObject, FederatedMouseEvent, Geometry, Texture } from "pixi.js";
    export function destroyChildIf<Child extends DisplayObject>(children: Child[], predicate: (child: Child, index: number) => boolean): void;
    export function isRightClick(event: FederatedMouseEvent): boolean;
    export function splitTex(texture: Texture, xFrames: number, yFrames: number, xWidth: number, yWidth: number): Texture<import("pixi.js").Resource>[][];
    export function loadGeometry(data: string): Promise<Geometry>;
}
declare module "app/src/util/DisplayObjectPool" {
    import { Container, DisplayObject, Renderer } from "pixi.js";
    interface DisplayObjectPoolOptions<T> {
        create: () => T;
        maxPoolSize?: number;
        destroyTimer?: number;
    }
    export class DisplayObjectPool<T extends DisplayObject> extends Container<T> {
        private pool;
        private options;
        constructor(options: DisplayObjectPoolOptions<T>);
        createChild(): T | undefined;
        destroyChild(child: T): void;
        destroyAll(): void;
        _render(renderer: Renderer): void;
    }
}
declare module "app/src/chart/component/edit/BarlineContainer" {
    import { Container } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export class BarlineContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private renderer;
        private barlineMap;
        private barlineLabelMap;
        private barlinePool;
        private barlineLabelPool;
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
    }
}
declare module "app/src/gui/popup/Popup" {
    import { DisplayObject } from "pixi.js";
    export interface PopupOptions {
        attach: DisplayObject | HTMLElement;
        title: string;
        description?: string;
        width?: number;
        height?: number;
        options?: PopupOption[];
        background?: string;
        textColor?: string;
        editable: boolean;
        cancelableOnOpen: boolean;
        clickHandler?: (event: MouseEvent) => void;
    }
    interface PopupOption {
        label: string;
        callback?: () => void;
        type: "delete" | "confirm" | "default";
    }
    export abstract class Popup {
        static active: boolean;
        static persistent: boolean;
        static options: PopupOptions;
        static popup?: HTMLDivElement;
        static view?: HTMLDivElement;
        static title?: HTMLDivElement;
        static desc?: HTMLDivElement;
        static editText?: HTMLDivElement;
        private static clickOutside?;
        private static moveInterval;
        private static updateInterval;
        static _open(options: PopupOptions): void;
        private static cloneRect;
        private static movePosition;
        private static _build;
        static buildContent(): void;
        static close(): void;
        static select(): void;
        static detach(): void;
        static attach(target: DisplayObject): void;
    }
}
declare module "app/src/gui/popup/CandlePopup" {
    import { CandleBox } from "app/src/chart/component/edit/CandleIndicator";
    import { Foot } from "app/src/chart/stats/parity/ParityDataTypes";
    import { Popup } from "app/src/gui/popup/Popup";
    export class CandlePopup extends Popup {
        static box?: CandleBox;
        static open(box: CandleBox, foot: Foot): void;
        static close(): void;
    }
}
declare module "app/src/util/BetterRoundedRect" {
    import { NineSlicePlane, Renderer, RenderTexture } from "pixi.js";
    export class BetterRoundedRect extends NineSlicePlane {
        private static graphics;
        static textures: {
            default: RenderTexture;
            noBorder: RenderTexture;
            onlyBorder: RenderTexture;
        };
        static init(renderer: Renderer): void;
        constructor(type?: keyof typeof BetterRoundedRect.textures);
    }
}
declare module "app/src/chart/component/RowStacker" {
    import { DisplayObject } from "pixi.js";
    import { ChartRenderer } from "app/src/chart/ChartRenderer";
    interface StackedSide {
        items: {
            object: StackableObject;
            priority: number;
            x: number | null;
            width?: number;
            beat: number;
            second: number;
            registerTime?: number;
        }[];
    }
    interface StackedRow {
        left: StackedSide;
        right: StackedSide;
    }
    type StackableObject = DisplayObject & {
        width: number;
    };
    export class RowStacker {
        static instance: RowStacker;
        renderer: ChartRenderer;
        rows: Map<string, StackedRow>;
        objectMap: Map<StackableObject, {
            key: string;
            animationId?: string;
            align: string;
        }>;
        constructor(renderer: ChartRenderer);
        register(object: StackableObject, beat: number, second: number, align: "left" | "right", priority: number, animate?: boolean): void;
        deregister(object: StackableObject): void;
        updatePriority(object: StackableObject, priority: number): void;
        updateAlign(object: StackableObject, align: "left" | "right"): void;
        updateX(rowKey: string): void;
        update(): void;
    }
}
declare module "app/src/chart/component/edit/CandleIndicator" {
    import { BitmapText, Container } from "pixi.js";
    import { BetterRoundedRect } from "app/src/util/BetterRoundedRect";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export interface CandleBox extends Container {
        bg: BetterRoundedRect;
        textObj: BitmapText;
    }
    export class CandleIndicator extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private renderer;
        private parityDirty;
        private boxPool;
        private highlightPool;
        private rowMap;
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
        createBox(): CandleBox;
    }
}
declare module "app/src/gui/widget/CaptureStatusWidget" {
    import { BitmapText } from "pixi.js";
    import { Widget } from "app/src/gui/widget/Widget";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    export class CaptureStatusWidget extends Widget {
        timeText: BitmapText;
        beatText: BitmapText;
        measureText: BitmapText;
        constructor(manager: WidgetManager);
        private createCounter;
        private createLine;
        update(): void;
    }
}
declare module "app/src/gui/widget/DancingBotWidget" {
    import { Container, Sprite } from "pixi.js";
    import { StageLayout } from "app/src/chart/stats/parity/StageLayouts";
    import { Widget } from "app/src/gui/widget/Widget";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    import { ParityState } from "app/src/chart/stats/parity/ParityDataTypes";
    interface StagePanel extends Container {
        bg: Sprite;
        arrow: Sprite;
    }
    interface FeetPosition {
        left: {
            x: number;
            y: number;
            angle: number;
        };
        right: {
            x: number;
            y: number;
            angle: number;
        };
    }
    export class DancingBotWidget extends Widget {
        panels: StagePanel[];
        currentRow: number;
        lastBeat: number;
        lastSecond: number;
        leftFoot?: Container;
        rightFoot?: Container;
        layout?: StageLayout;
        dirty: boolean;
        constructor(manager: WidgetManager);
        build(): Promise<void>;
        reindex(): void;
        update(): void;
        getFeetPosition(state: ParityState): FeetPosition;
        getPlayerAngle(left: {
            x: number;
            y: number;
        }, right: {
            x: number;
            y: number;
        }): number;
        lerpPositions(positionA: FeetPosition, positionB: FeetPosition, t: number, state: ParityState): FeetPosition;
        flashPanel(col: number): void;
    }
}
declare module "app/src/util/Performance" {
    global {
        interface Performance {
            memory?: {
                /** The maximum size of the heap, in bytes, that is available to the context. */
                jsHeapSizeLimit: number;
                /** The total allocated heap size, in bytes. */
                totalJSHeapSize: number;
                /** The currently active segment of JS heap, in bytes. */
                usedJSHeapSize: number;
            };
        }
    }
    export function getFPS(): number;
    export function fpsUpdate(): void;
    export function getTPS(): number;
    export function tpsUpdate(): void;
}
declare module "app/src/gui/widget/DebugWidget" {
    import { Widget } from "app/src/gui/widget/Widget";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    export class DebugWidget extends Widget {
        static instance?: DebugWidget;
        private frameTimeGraph;
        private drawUpdateTimeGraph;
        private updateTimeGraph;
        private memoryTimeGraph;
        private cpuGraph;
        private graphs;
        private fpsCounter;
        private fpsBg;
        private fpsText;
        private lastFrameTime;
        private properties;
        constructor(manager: WidgetManager);
        update(): void;
        addMemoryTimeValue(value: number): void;
        addFrameTimeValue(value: number): void;
        addUpdateTimeValue(value: number): void;
        addDrawUpdateTimeValue(value: number): void;
        setProperty(key: string, value: any): void;
        clearProperty(key: string): void;
        clearProperties(): void;
    }
}
declare module "app/src/gui/widget/PlayInfoWidget" {
    import { Widget } from "app/src/gui/widget/Widget";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    export class PlayInfoWidget extends Widget {
        private max;
        private barlines;
        private backgroundRect;
        private background;
        private backgroundLines;
        private statText;
        private readonly meanText;
        private readonly medianText;
        private readonly modeText;
        private readonly stddevText;
        private errorMS;
        private texts;
        showEase: number;
        private toggled;
        private drag;
        private dragStart;
        private lastMode;
        constructor(manager: WidgetManager);
        update(): void;
        private newLine;
        startPlay(): void;
        private redraw;
        private adjustOffset;
    }
}
declare module "app/src/gui/widget/PlaybackOptionsWidget" {
    import { Widget } from "app/src/gui/widget/Widget";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    interface SpinnerOptions {
        value?: number;
        step?: number;
        altStep?: number;
        min?: number;
        max?: number;
        hardMin?: number;
        hardMax?: number;
        getValue: () => number;
        onChange: (value: number) => void;
    }
    interface ToggleOptions {
        getValue: () => number;
        onChange: (value: string | HTMLElement, index: number) => void;
        value?: number;
        values: (string | HTMLElement)[];
    }
    interface CheckboxOptions {
        getValue: () => boolean;
        onChange: (value: boolean) => void;
        value: boolean;
        onEl: HTMLElement;
        offEl: HTMLElement;
    }
    export class PlaybackOptionsWidget extends Widget {
        private registeredSpinners;
        private registeredToggles;
        private registeredCheckboxes;
        private changeRow;
        private warpRow;
        private fakeRow;
        private view;
        private collapseButton;
        private lastSpeedMod;
        private rateSpinner;
        private enteredMain;
        constructor(manager: WidgetManager);
        createRow(name: string): HTMLDivElement;
        createSeparator(): HTMLDivElement;
        createSpinner(options: SpinnerOptions): HTMLDivElement;
        createToggle(options: ToggleOptions): HTMLDivElement;
        createCheckbox(options: CheckboxOptions): HTMLDivElement;
        update(): void;
        private parseString;
    }
}
declare module "app/src/chart/component/timing/TimingAreaContainer" {
    import { Container } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export const TIMING_EVENT_COLORS: {
        [key: string]: number;
    };
    export class TimingAreaContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private renderer;
        private areaPool;
        private timingAreaMap;
        private timingEvents;
        private timingDirty;
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
        private shouldDrawEvent;
    }
}
declare module "app/src/data/SplitTimingData" {
    import { ChartTimingData } from "app/src/chart/sm/ChartTimingData";
    import { TimingEventType } from "app/src/chart/sm/TimingTypes";
    export const SPLIT_TIMING_DATA: {
        chart: {
            title: string;
            desc: string;
            convertText: string;
            buttonOne: {
                text: string;
                tooltip: string;
                tooltipAll: string;
                action: (timingData: ChartTimingData, type: TimingEventType) => void;
                actionAll: (timingData: ChartTimingData) => void;
            };
            buttonTwo: {
                text: string;
                tooltip: string;
                tooltipAll: string;
                action: (timingData: ChartTimingData, type: TimingEventType) => void;
                actionAll: (timingData: ChartTimingData) => void;
            };
        };
        song: {
            title: string;
            desc: string;
            convertText: string;
            buttonOne: {
                text: string;
                tooltip: string;
                tooltipAll: string;
                action: (timingData: ChartTimingData, type: TimingEventType) => void;
                actionAll: (timingData: ChartTimingData) => void;
            };
            buttonTwo: {
                text: string;
                tooltip: string;
                tooltipAll: string;
                action: (timingData: ChartTimingData, type: TimingEventType) => void;
                actionAll: (timingData: ChartTimingData) => void;
            };
        };
    };
    export const SPLIT_OFFSET_DATA: {
        chart: {
            title: string;
            desc: string;
            convertText: string;
            buttonOne: {
                text: string;
                tooltip: string;
                action: (timingData: ChartTimingData) => void;
            };
            buttonTwo: {
                text: string;
                tooltip: string;
                action: (timingData: ChartTimingData) => void;
            };
        };
        song: {
            title: string;
            desc: string;
            convertText: string;
            buttonOne: {
                text: string;
                tooltip: string;
                action: (timingData: ChartTimingData) => void;
            };
            buttonTwo: {
                text: string;
                tooltip: string;
                action: (timingData: ChartTimingData) => void;
            };
        };
    };
}
declare module "app/src/gui/popup/SplitTimingPopup" {
    import { App } from "app/src/App";
    import { TimingEventType } from "app/src/chart/sm/TimingTypes";
    import { Popup } from "app/src/gui/popup/Popup";
    export class SplitTimingPopup extends Popup {
        private static app;
        private static timingGrid;
        private static onTimingChange;
        static open(app: App): void;
        static buildContent(): void;
        static updateValues(): HTMLDivElement;
        static buildRow(eventType: TimingEventType): HTMLDivElement;
        static buildModifyGrid(): HTMLDivElement;
        static close(): void;
    }
}
declare module "app/src/gui/popup/TimingTrackOrderPopup" {
    import { Popup } from "app/src/gui/popup/Popup";
    export class TimingTrackOrderPopup extends Popup {
        private static draggedElement?;
        private static dragOffsetX;
        private static dragOffsetY;
        private static grid?;
        private static leftovers?;
        private static boundaryCache;
        static open(): void;
        static buildContent(): void;
        private static makeDraggableTrack;
        private static makeLeftoverTrack;
        private static startDragging;
        private static saveOptions;
        private static deleteTrack;
        private static getClosestSlot;
        private static getBoundaries;
        private static clearBoundaries;
        static close(): void;
    }
}
declare module "app/src/gui/window/SyncWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class SyncWindow extends Window {
        app: App;
        private onAudioLoad;
        private onResize;
        private windowStep;
        private fftSize;
        private tempoFftSize;
        private tempoStep;
        private monoAudioData?;
        private audioLength;
        private sampleRate;
        private tempogram;
        private tempogramGroups;
        private spectrogram;
        private spectrogramDifference;
        private noveltyCurve;
        private noveltyCurveIsolated;
        private spectrogramCanvases;
        private lowestFinishedBlock;
        private numRenderedBlocks;
        private peaks;
        private _threshold;
        private spectroHeights;
        private spectroWeights;
        private placeNotesSelectionButton;
        private toggleButton;
        private resetButton;
        private onsetResults;
        private offsetTableLabel;
        private offsetRows;
        private bpmRows;
        private covers;
        private doAnalysis;
        private lastSecond;
        constructor(app: App);
        onClose(): void;
        initView(): void;
        resize(): void;
        createOptionsView(): HTMLDivElement;
        createTempoView(): HTMLDivElement;
        createOnsetsView(): HTMLDivElement;
        reset(): Promise<void>;
        hasData(): boolean;
        windowLoop(canvas: HTMLCanvasElement): () => void;
        renderBlock(blockNum: number): void;
        calcDifference(blockNum: number): void;
        storeResponse(blockNum: number, response: Float64Array): void;
        storeDifferenceResponse(blockNum: number, response: Float64Array): void;
        calcIsolatedNovelty(blockNum: number): void;
        storeIsolatedNovelty(blockNum: number, sum: number): void;
        getMonoAudioData(): Promise<void>;
        get threshold(): number;
        set threshold(value: number);
        calculateOffset(): void;
        placeOnsets(selection?: boolean): void;
        calcTempogram(): void;
        storeTempogram(blockNum: number, response: Float64Array): void;
    }
}
declare module "app/src/gui/widget/StatusWidget" {
    import { Widget } from "app/src/gui/widget/Widget";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    export class StatusWidget extends Widget {
        private view;
        private readonly playbackBar;
        private readonly skipStart;
        private readonly skipEnd;
        private readonly play;
        private readonly playIcon;
        private readonly stopIcon;
        private readonly record;
        private readonly playtest;
        private readonly timeCounter;
        private readonly beatCounter;
        private readonly min;
        private readonly sec;
        private readonly millis;
        private readonly beat;
        private readonly beatDropdown;
        private readonly editBar;
        private readonly editSteps;
        private readonly editTiming;
        private readonly stepsContainer;
        private readonly timingContainer;
        private readonly editChoiceContainer;
        private readonly addTimingEvent;
        private readonly splitTiming;
        private readonly toggleTimingTracks;
        private readonly detectSync;
        private readonly offsetCounter;
        private readonly offset;
        private noteArrows;
        private readonly noteArrowMask;
        private lastTime;
        private lastBeat;
        private lastOffset;
        private lastMode;
        private lastTimingMode;
        private lastHover;
        private lastPlaying;
        private hovering;
        private trackingMovement;
        private idleFrames;
        private lastBounds?;
        constructor(manager: WidgetManager);
        update(): void;
        private selectText;
        private updateTime;
        private updateBeat;
        private updateOffset;
        private parseString;
    }
}
declare module "app/src/gui/widget/timeline/DensityWidget" {
    import { Graphics } from "pixi.js";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    import { BaseTimelineWidget } from "app/src/gui/widget/timeline/BaseTimelineWidget";
    export class DensityWidget extends BaseTimelineWidget {
        npsGraph: Graphics;
        private graphGradient;
        private graphWidth;
        private npsText;
        constructor(manager: WidgetManager);
        private updateNpsDisplay;
        private hideNpsDisplay;
        private showNpsDisplay;
        update(): void;
        populate(startBeat?: number, endBeat?: number): void;
        private makeGradient;
    }
}
declare module "app/src/gui/widget/timeline/FacingWidget" {
    import { ParticleContainer, RenderTexture, Sprite } from "pixi.js";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    import { BaseTimelineWidget } from "app/src/gui/widget/timeline/BaseTimelineWidget";
    export class FacingLayoutWidget extends BaseTimelineWidget {
        barContainer: ParticleContainer<Sprite>;
        bars: Sprite;
        barTexture: RenderTexture;
        middleLine: Sprite;
        colorCache: Map<number, string>;
        constructor(manager: WidgetManager);
        update(): void;
        populate(startBeat?: number, endBeat?: number): void;
    }
}
declare module "app/src/gui/popup/SnapPopup" {
    import { Graphics } from "pixi.js";
    import { Popup } from "app/src/gui/popup/Popup";
    export class SnapPopup extends Popup {
        private static onSnapChange;
        private static divInput;
        private static divLabel;
        private static beatInput;
        static open(snapSprite: Graphics): void;
        static buildContent(): void;
        private static updateValues;
        private static suffixSnap;
        static close(): void;
    }
}
declare module "app/src/chart/component/edit/SnapContainer" {
    import { Container } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export const QUANT_COLORS: {
        [key: number]: number;
    };
    export class SnapContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private renderer;
        children: Container[];
        constructor(renderer: ChartRenderer);
        update(): void;
    }
}
declare module "app/src/gui/widget/timeline/NoteLayoutWidget" {
    import { ParticleContainer, RenderTexture, Sprite } from "pixi.js";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    import { BaseTimelineWidget } from "app/src/gui/widget/timeline/BaseTimelineWidget";
    export class NoteLayoutWidget extends BaseTimelineWidget {
        barContainer: ParticleContainer<Sprite>;
        bars: Sprite;
        barTexture: RenderTexture;
        constructor(manager: WidgetManager);
        update(): void;
        populate(startBeat?: number, endBeat?: number): void;
        private shouldDisplayNote;
    }
}
declare module "app/src/gui/widget/WidgetManager" {
    import { Container } from "pixi.js";
    import { App } from "app/src/App";
    import { ChartManager } from "app/src/chart/ChartManager";
    import { Widget } from "app/src/gui/widget/Widget";
    export class WidgetManager extends Container {
        app: App;
        chartManager: ChartManager;
        children: Widget[];
        constructor(chartManager: ChartManager);
        update(): void;
        startPlay(): void;
        endPlay(): void;
    }
}
declare module "app/src/gui/widget/Widget" {
    import { Container } from "pixi.js";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    export abstract class Widget extends Container {
        manager: WidgetManager;
        protected constructor(manager: WidgetManager);
        abstract update(): void;
        startPlay(): void;
        endPlay(): void;
    }
}
declare module "app/src/gui/widget/timeline/BaseTimelineWidget" {
    import { Container, FederatedPointerEvent, Sprite } from "pixi.js";
    import { Chart } from "app/src/chart/sm/Chart";
    import { BetterRoundedRect } from "app/src/util/BetterRoundedRect";
    import { DisplayObjectPool } from "app/src/util/DisplayObjectPool";
    import { Widget } from "app/src/gui/widget/Widget";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    interface TimelineWidgetOptions {
        backingWidth?: number;
        order?: number;
        trigger: "chart" | "parity";
    }
    export class BaseTimelineWidget extends Widget {
        backing: BetterRoundedRect;
        overlay: Sprite;
        receptor: Sprite;
        selectionOverlay: Sprite;
        container: Container;
        errors: DisplayObjectPool<Sprite>;
        errorMap: Map<number, Sprite>;
        protected lastHeight: number;
        protected lastBeat: number;
        protected mouseDown: boolean;
        protected queued: boolean;
        protected verticalMargin: number;
        protected backingVerticalPadding: number;
        protected backingWidth: number;
        private xOffset;
        private dragStartT;
        private dragEndT;
        _order: number;
        static widgets: BaseTimelineWidget[];
        static xGap: number;
        static xMargin: number;
        constructor(manager: WidgetManager, options?: Partial<TimelineWidgetOptions>);
        protected handleMouse(event: FederatedPointerEvent, drag?: boolean): void;
        update(): void;
        populateRange(): void;
        updateDimensions(): void;
        getYFromBeat(beat: number): number;
        getYFromSecond(second: number): number;
        getSongPositionFromT(t: number): {
            second: number;
            beat: number;
        };
        getTopSecond(): number;
        getBottomSecond(): number;
        getTopBeat(): number;
        getBottomBeat(): number;
        populate(_topBeat?: number, _bottomBeat?: number): void;
        protected getChart(): Chart;
        get order(): number;
        set order(value: number);
        static register(widget: BaseTimelineWidget): void;
        static resort(): void;
        static getTotalWidgetWidth(): number;
    }
}
declare module "app/src/chart/component/edit/ParityDebug" {
    import { BitmapText, Container, Sprite } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    import { Foot } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ParityDebugData } from "app/src/chart/stats/parity/ParityWebWorkerTypes";
    interface DebugObject extends Container {
        text: BitmapText;
        update: (parityData: ParityDebugData) => string;
    }
    interface DetailBox extends Container {
        text: BitmapText;
        background: Sprite;
    }
    export const PARITY_COLORS: Record<Foot, number>;
    export class ParityDebug extends Container implements ChartRendererComponent {
        readonly isEditGUI = false;
        private renderer;
        private chartDirty;
        private lastVisible;
        private debugTexts;
        private debugContainer;
        private debugBG;
        private connections;
        private rowMap;
        private rowPool;
        private activeNode?;
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
        createBoxWithText(options: {
            boxWidth?: number;
            boxHeight?: number;
            boxTint?: number;
            boxOpacity?: number;
            text: string;
            textTint?: number;
            textOpacity?: number;
        }): DetailBox;
        createDebugObject(tint: number, update: (parityData: ParityDebugData) => string): DebugObject;
    }
}
declare module "app/src/chart/component/edit/PreviewAreaContainer" {
    import { Container } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export class PreviewAreaContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private previewArea;
        private previewText;
        private renderer;
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
    }
}
declare module "app/src/chart/component/edit/ScrollDebug" {
    import { Container, Sprite } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export class ScrollDebug extends Container implements ChartRendererComponent {
        readonly isEditGUI = false;
        private renderer;
        private scrollMap;
        private receptors;
        private topBound;
        private bottomBound;
        private topBoundBeat;
        private bottomBoundBeat;
        private topScreenBeat;
        private bottomScreenBeat;
        private topScreenBeatText;
        private bottomScreenBeatText;
        children: Container[];
        constructor(renderer: ChartRenderer);
        createBar(tint: number): Sprite;
        update(): void;
        inBounds(y: number): boolean;
    }
}
declare module "app/src/chart/component/edit/SelectionAreaContainer" {
    import { Container } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export class SelectionAreaContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private startMarker;
        private selectionArea;
        private renderer;
        constructor(renderer: ChartRenderer);
        update(): void;
    }
}
declare module "app/src/chart/component/edit/SelectionSprite" {
    import { Sprite } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export class SelectionBoundary extends Sprite implements ChartRendererComponent {
        readonly isEditGUI = true;
        private renderer;
        constructor(renderer: ChartRenderer);
        update(): void;
    }
}
declare module "app/src/gui/popup/TechErrorPopup" {
    import { TechBox } from "app/src/chart/component/edit/TechErrorIndicators";
    import { Chart } from "app/src/chart/sm/Chart";
    import { TechErrors } from "app/src/chart/stats/parity/ParityDataTypes";
    import { Popup, PopupOptions } from "app/src/gui/popup/Popup";
    interface TechErrorPopupOptions {
        box: TechBox;
        beat: number;
        error: TechErrors;
        ignored: boolean;
        chart: Chart;
    }
    export class TechErrorPopup extends Popup {
        static options: TechErrorPopupOptions & PopupOptions;
        static cachedError?: {
            beat: number;
            error: TechErrors;
        };
        static editText: HTMLDivElement;
        static onParityChange: () => void;
        static open(options: TechErrorPopupOptions): void;
        static buildContent(): void;
        private static updateValues;
        static close(): void;
        static getError(): {
            beat: number;
            error: TechErrors;
        } | undefined;
    }
}
declare module "app/src/chart/component/edit/TechErrorIndicators" {
    import { BitmapText, Container } from "pixi.js";
    import { BetterRoundedRect } from "app/src/util/BetterRoundedRect";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export interface TechBox extends Container {
        bg: BetterRoundedRect;
        icon: Container;
        textObj: BitmapText;
        setText(text: string): void;
        ignore(): void;
        unignore(): void;
    }
    export class TechErrorIndicators extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private renderer;
        private parityDirty;
        private errorIconTexture;
        private errorIconIgnoredTexture;
        private boxPool;
        private highlightPool;
        private reposition;
        private topCounter;
        private bottomCounter;
        private previousTopVisible;
        private previousBottomVisible;
        private rowMap;
        children: Container[];
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
        createErrorBox(): TechBox;
    }
}
declare module "app/src/gui/popup/TechPopup" {
    import { TechBox } from "app/src/chart/component/edit/TechIndicators";
    import { TechCategory } from "app/src/chart/stats/parity/ParityDataTypes";
    import { Popup } from "app/src/gui/popup/Popup";
    export class TechPopup extends Popup {
        static box?: TechBox;
        static open(box: TechBox, tech: TechCategory): void;
        static close(): void;
    }
}
declare module "app/src/chart/component/edit/TechIndicators" {
    import { BitmapText, Container } from "pixi.js";
    import { BetterRoundedRect } from "app/src/util/BetterRoundedRect";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    import { Cached, TimingEvent } from "app/src/chart/sm/TimingTypes";
    export interface TechBox extends Container {
        event: Cached<TimingEvent>;
        backgroundObj: BetterRoundedRect;
        textObj: BitmapText;
    }
    export class TechIndicators extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private renderer;
        private parityDirty;
        private boxPool;
        private rowMap;
        children: Container[];
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
    }
}
declare module "app/src/chart/component/edit/Waveform" {
    import { Sprite } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export class Waveform extends Sprite implements ChartRendererComponent {
        readonly isEditGUI = true;
        private lineContainer;
        private readonly waveformTex;
        private renderer;
        private rawData;
        private filteredRawData;
        private speed;
        private lastSpeed;
        private lastSpeedTimeout?;
        private sampleRate;
        private poolSearch;
        private trackedVariables;
        private drawDirty;
        private blockCache;
        private colorCache;
        private filteredColorCache;
        constructor(renderer: ChartRenderer);
        private getData;
        private resizeWaveform;
        update(): void;
        private trackVariable;
        private variableChanged;
        private getSample;
        private renderData;
        private drawLine;
        private resetPool;
        private purgePool;
        private updateLineHeight;
        private getLine;
        private getSpeed;
    }
}
declare module "app/src/chart/component/notefield/HoldJudgementContainer" {
    import { Container, Sprite } from "pixi.js";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    import { Notefield } from "app/src/chart/component/notefield/Notefield";
    interface HoldJudgementObject extends Sprite {
        createTime: number;
    }
    export class HoldJudgementContainer extends Container {
        children: HoldJudgementObject[];
        private static held_tex?;
        private static dropped_tex?;
        private readonly notefield;
        constructor(notefield: Notefield);
        loadTex(): Promise<void>;
        update(): void;
        addJudge(col: number, judgement: TimingWindow): void;
    }
}
declare module "app/src/chart/component/notefield/NoteContainer" {
    import { Container, Sprite } from "pixi.js";
    import { Notefield, NoteWrapper } from "app/src/chart/component/notefield/Notefield";
    interface HighlightedNoteObject extends Container {
        selection: Sprite;
        parity: Sprite;
        parityOverride: Sprite;
        wrapper: NoteWrapper;
        lastActive: boolean;
    }
    export class NoteContainer extends Container {
        private readonly notefield;
        private arrowMap;
        private notesDirty;
        readonly children: HighlightedNoteObject[];
        constructor(notefield: Notefield);
        update(firstBeat: number, lastBeat: number): void;
        private shouldDisplayNote;
    }
}
declare module "app/src/chart/component/notefield/NoteFlashContainer" {
    import { Container } from "pixi.js";
    import { NoteskinSprite } from "app/src/chart/gameTypes/noteskin/Noteskin";
    import { Notefield } from "app/src/chart/component/notefield/Notefield";
    export class NoteFlashContainer extends Container {
        private readonly notefield;
        readonly children: NoteskinSprite[];
        constructor(notefield: Notefield);
        update(): void;
    }
}
declare module "app/src/chart/component/notefield/ReceptorContainer" {
    import { Container } from "pixi.js";
    import { NoteskinSprite } from "app/src/chart/gameTypes/noteskin/Noteskin";
    import { Notefield } from "app/src/chart/component/notefield/Notefield";
    export class ReceptorContainer extends Container {
        private readonly notefield;
        readonly children: NoteskinSprite[];
        private dragStart;
        private dragOptionsStart;
        private optionUpdate;
        constructor(notefield: Notefield);
        destroy(): void;
        update(): void;
    }
}
declare module "app/src/chart/component/notefield/SelectionNoteContainer" {
    import { Container, Sprite } from "pixi.js";
    import { Notefield, NoteWrapper } from "app/src/chart/component/notefield/Notefield";
    interface HighlightedNoteObject extends Container {
        selection: Sprite;
        wrapper: NoteWrapper;
    }
    export class SelectionNoteContainer extends Container {
        private readonly notefield;
        private readonly arrowMap;
        readonly children: HighlightedNoteObject[];
        private lastBeatShift;
        private lastColShift;
        constructor(notefield: Notefield);
        update(firstBeat: number, lastBeat: number): void;
    }
}
declare module "app/src/util/VertCropSprite" {
    import { NineSlicePlane, Texture } from "pixi.js";
    export class VertCropSprite extends NineSlicePlane {
        private offsetY;
        private setY;
        private _last;
        private _lastTop;
        constructor(texture: Texture);
        cropBottom(pixels: number, force?: boolean): void;
        cropTop(pixels: number, force?: boolean): void;
        get y(): number;
        set y(value: number);
        private _updateY;
        refresh(): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/_template/HoldTail" {
    import { IDestroyOptions, Texture } from "pixi.js";
    import { VertCropSprite } from "app/src/util/VertCropSprite";
    export class HoldTail extends VertCropSprite {
        constructor(texture: Texture, holdWidth?: number);
    }
    export class AnimatedHoldTail extends HoldTail {
        private _playing;
        private _autoUpdate;
        private _isConnectedToTicker;
        private _tickerUpdate;
        private _currentTime;
        private _textures;
        private _previousFrame;
        onComplete: (() => void) | null;
        onLoop: (() => void) | null;
        onFrameChange: ((frame: number) => void) | null;
        animationSpeed: number;
        loop: boolean;
        updateAnchor: boolean;
        constructor(textures: Texture[], holdWidth: number);
        stop(): void;
        play(): void;
        gotoAndStop(frameNumber: number): void;
        gotoAndPlay(frameNumber: number): void;
        update(deltaTime: number): void;
        updateTexture(): void;
        destroy(options?: IDestroyOptions | boolean): void;
        get totalFrames(): number;
        get textures(): Texture[];
        set textures(value: Texture[]);
        get currentFrame(): number;
        set currentFrame(value: number);
        get playing(): boolean;
        get autoUpdate(): boolean;
        set autoUpdate(value: boolean);
    }
}
declare module "app/src/chart/component/notefield/Notefield" {
    import { Container, Sprite } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    import { Noteskin, NoteskinElementCreationOptions, NoteskinElementOptions, NoteskinOptions, NoteskinSprite } from "app/src/chart/gameTypes/noteskin/Noteskin";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    import { HoldNotedataEntry, NotedataEntry, TapNotedataEntry } from "app/src/chart/sm/NoteTypes";
    export type NotefieldObject = NoteObject | HoldObject;
    export class NoteWrapper extends Container {
        object: NotefieldObject;
        icon: Sprite;
        constructor(object: NotefieldObject);
        loadEventHandler(): void;
    }
    export class NoteObject extends Container {
        type: string;
        note: NotedataEntry;
        readonly nf: Notefield;
        constructor(notefield: Notefield, note: TapNotedataEntry);
        loadElement(note: TapNotedataEntry): void;
    }
    export class HoldObject extends Container {
        type: string;
        note: HoldNotedataEntry;
        private active;
        private inactive;
        private wasActive;
        private lastLength;
        private elements;
        private readonly metrics;
        private readonly ns;
        readonly nf: Notefield;
        private loaded;
        constructor(notefield: Notefield, note: HoldNotedataEntry);
        loadElements(): void;
        getNoteskinElement(element: string): NoteskinSprite;
        setActive(active: boolean): void;
        setBrightness(brightness: number): void;
        setLength(length: number): void;
    }
    export class Notefield extends Container implements ChartRendererComponent {
        readonly isEditGUI = false;
        noteskinOptions?: NoteskinOptions;
        noteskin?: Noteskin;
        readonly gameType: import("app/src/chart/gameTypes/GameTypeRegistry").GameType;
        readonly renderer: ChartRenderer;
        private receptors?;
        private notes?;
        private selectionNotes?;
        private flashes?;
        private holdJudges?;
        private ghostNote?;
        private ghostNoteEntry?;
        private readonly columnX;
        constructor(renderer: ChartRenderer);
        setGhostNote(note?: NotedataEntry): void;
        getElement(element: NoteskinElementOptions, options?: Partial<NoteskinElementCreationOptions>): NoteskinSprite;
        update(firstBeat: number, lastBeat: number): void;
        onJudgement(col: number, judge: TimingWindow): void;
        startPlay(): void;
        endPlay(): void;
        press(col: number): void;
        lift(col: number): void;
        ghostTap(col: number): void;
        activateHold(col: number): void;
        releaseHold(col: number): void;
        activateRoll(col: number): void;
        releaseRoll(col: number): void;
        getColumnX(col: number): number;
        getColumnWidth(col: number): number;
        getColumnName(col: number): string;
        createNote(note: NotedataEntry): NoteWrapper;
    }
}
declare module "app/src/chart/component/play/ComboNumber" {
    import { BitmapText } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    export class ComboNumber extends BitmapText implements ChartRendererComponent {
        readonly isEditGUI = false;
        private renderer;
        constructor(renderer: ChartRenderer);
        update(): void;
    }
}
declare module "app/src/chart/component/play/ErrorBarContainer" {
    import { Container } from "pixi.js";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    export class ErrorBarContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = false;
        private barlines;
        private readonly barline;
        private readonly currentMedian;
        private errorText;
        private errorTextTime;
        private renderer;
        private target;
        constructor(renderer: ChartRenderer);
        update(): void;
        addBar(error: number | null, judge: TimingWindow): void;
        reset(): void;
    }
}
declare module "app/src/chart/component/play/JudgementSprite" {
    import { Sprite } from "pixi.js";
    import { ChartRendererComponent } from "app/src/chart/ChartRenderer";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    export class JudgementSprite extends Sprite implements ChartRendererComponent {
        readonly isEditGUI = false;
        private createTime;
        private active;
        private type;
        constructor();
        update(): void;
        doJudge(error: number | null, judgment: TimingWindow): Promise<void>;
        reset(): void;
    }
}
declare module "app/src/gui/popup/TimingColumnPopup" {
    import { Container } from "pixi.js";
    import { ChartTimingData } from "app/src/chart/sm/ChartTimingData";
    import { TimingEvent, TimingEventType } from "app/src/chart/sm/TimingTypes";
    import { Popup, PopupOptions } from "app/src/gui/popup/Popup";
    interface TimingColumnPopupOptions {
        attach: Container;
        type: TimingEventType;
        timingData: ChartTimingData;
    }
    export class TimingColumnPopup extends Popup {
        static options: TimingColumnPopupOptions & PopupOptions;
        private static convertText;
        private static convertBtnOne;
        private static convertBtnTwo;
        private static readonly onTimingChange;
        onConfirm: (event: TimingEvent) => void;
        persistent: boolean;
        static open(options: TimingColumnPopupOptions): void;
        static buildContent(): void;
        static close(): void;
        static updateValues(): void;
    }
}
declare module "app/src/data/TimingEventPopupData" {
    import { TimingEventType } from "app/src/chart/sm/TimingTypes";
    interface Popup {
        rows: PopupRow[];
        title: string;
        description?: string;
        width?: number;
    }
    export interface PopupRow {
        label: string;
        key: string;
        input: PopupInput;
    }
    type PopupInput = PopupInputSpinner | PopupInputText | PopupInputDropdown | PopupInputCheckbox;
    interface PopupInputSpinner {
        type: "spinner";
        step?: number | null;
        precision?: number;
        minPrecision?: number | null;
        min?: number;
        max?: number;
    }
    interface PopupInputText {
        type: "text";
    }
    interface PopupInputDropdown {
        type: "dropdown";
        items: string[];
        transformers?: {
            serialize: (value: string) => string;
            deserialize: (value: string) => string;
        };
    }
    interface PopupInputCheckbox {
        type: "checkbox";
    }
    export const POPUP_ROWS: {
        [key in TimingEventType]: Popup;
    };
}
declare module "app/src/gui/popup/TimingEventPopup" {
    import { TimingBox } from "app/src/chart/component/timing/TimingTrackContainer";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { TimingEvent } from "app/src/chart/sm/TimingTypes";
    import { Popup, PopupOptions } from "app/src/gui/popup/Popup";
    interface TimingEventPopupOptions {
        box: TimingBox;
        timingData: TimingData;
        modifyBox: boolean;
        onConfirm: (event: TimingEvent) => void;
    }
    export class TimingEventPopup extends Popup {
        static options: TimingEventPopupOptions & PopupOptions;
        static cachedEvent: TimingEvent;
        private static rows;
        static onTimingChange: () => void;
        static open(options: TimingEventPopupOptions): void;
        static buildContent(): void;
        private static buildRow;
        private static modifyEvent;
        private static updateValues;
        static close(): void;
        static getEvent(): TimingEvent;
        static attach(target: TimingBox): void;
    }
}
declare module "app/src/chart/component/timing/TimingTrackContainer" {
    import { BitmapText, Container, Point, Sprite } from "pixi.js";
    import { BetterRoundedRect } from "app/src/util/BetterRoundedRect";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    import { Cached, TimingEvent } from "app/src/chart/sm/TimingTypes";
    export interface TimingBox extends Container {
        event: Cached<TimingEvent>;
        backgroundObj: BetterRoundedRect;
        selection: BetterRoundedRect;
        textObj: BitmapText;
        guideLine?: Sprite;
        lastX?: number;
        lastAnchor?: number;
        animationId?: string;
    }
    interface TimingTrack extends Container {
        type: string;
        timingMode: "chart" | "song";
        background: Sprite;
        btns: Container;
    }
    export const timingNumbers: {
        fontName: string;
        fontSize: number;
    };
    export const TIMING_TRACK_WIDTHS: {
        [key: string]: number;
    };
    export class TimingTrackContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        private tracks;
        private renderer;
        private timingBoxMap;
        private wasEditingTiming;
        private boxPool;
        private ghostBox?;
        private timingDirty;
        private tracksDirty;
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
        private createTrack;
        private initializeBox;
        private addDragListeners;
        private updateTracks;
        private updateBoxes;
        updateGhostEvent(pos: Point): void;
        placeGhostEvent(): void;
        getClosestTrack(x: number): TimingTrack | undefined;
        getLabelFromEvent(event: TimingEvent): string;
        private getTargetTimingData;
    }
}
declare module "app/src/chart/component/timing/SelectionTimingEventContainer" {
    import { BitmapText, Container, Sprite } from "pixi.js";
    import { BetterRoundedRect } from "app/src/util/BetterRoundedRect";
    import { ChartRenderer, ChartRendererComponent } from "app/src/chart/ChartRenderer";
    import { TimingEvent, TimingEventType } from "app/src/chart/sm/TimingTypes";
    interface TimingBox extends Container {
        event: TimingEvent;
        guideLine: Sprite;
        deactivated: boolean;
        marked: boolean;
        dirtyTime: number;
        backgroundObj: BetterRoundedRect;
        textObj: BitmapText;
    }
    export class SelectionTimingEventContainer extends Container implements ChartRendererComponent {
        readonly isEditGUI = true;
        children: TimingBox[];
        private renderer;
        private timingBoxMap;
        private trackPosCache;
        private timingBoxPool;
        constructor(renderer: ChartRenderer);
        update(firstBeat: number, lastBeat: number): void;
        getTrackPos(type: TimingEventType): number;
    }
}
declare module "app/src/chart/ChartRenderer" {
    import { Container, DisplayObject } from "pixi.js";
    import { ChartManager } from "app/src/chart/ChartManager";
    import { Notefield } from "app/src/chart/component/notefield/Notefield";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    import { Chart } from "app/src/chart/sm/Chart";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { Cached, ScrollTimingEvent, TimingEvent } from "app/src/chart/sm/TimingTypes";
    interface SelectionBounds {
        startX: number;
        startBeat: number;
        endBeat: number;
        endX: number;
        lastKnownBeat: number;
    }
    export interface ChartRendererComponent extends DisplayObject {
        update: (firstBeat: number, lastBeat: number) => void;
        readonly isEditGUI: boolean;
    }
    export class ChartRenderer extends Container<ChartRendererComponent> {
        chartManager: ChartManager;
        chart: Chart;
        private speedMult;
        private lastMousePos?;
        private lastMouseBeat;
        private lastMouseCol;
        private lastNoteType;
        private lastHoldBeat;
        private editingCol;
        private cachedBeat;
        private cachedTime;
        private readonly waveform;
        private readonly barlines;
        private readonly timingAreas;
        private readonly timingTracks;
        private readonly techIndicators;
        private readonly techErrors;
        private readonly candleIndicator;
        private readonly selectedEvents;
        private readonly timingBar;
        private notefield;
        private readonly snapDisplay;
        private readonly judgement;
        private readonly combo;
        private readonly selectionBoundary;
        private readonly selectionArea;
        private readonly previewArea;
        private readonly scrollDebug;
        private readonly parityDebug;
        private selectionBounds?;
        constructor(chartManager: ChartManager);
        isDragSelecting(): boolean;
        doJudgement(note: NotedataEntry, error: number | null, judgement: TimingWindow): void;
        startPlay(): void;
        endPlay(): void;
        update(): void;
        /**
         * Gets the current time including play offset
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getTimeWithOffset(): number;
        /**
         * Gets the current beat including play offset
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getBeatWithOffset(): number;
        /**
         * Gets the current time including play and visual offset
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getVisualTime(): number;
        /**
         * Gets the current beat including play and visual offset
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getVisualBeat(): number;
        getXPosFromColumn(col: number): number;
        /**
         * Returns the y position for a note on the given beat.
         *
         * @param {number} beat
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getYPosFromBeat(beat: number): number;
        /**
         * Returns the y position for a note at the given second.
         * Use this method to prevent calculating the current second (usually in CMod).
         *
         * @param {number} time
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getYPosFromSecond(time: number): number;
        /**
         * Returns the second for a note at the specified y position.
         * May return an incorrect value when negative scrolls are used.
         *
         * @param {number} yp
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getSecondFromYPos(yp: number): number;
        /**
         * Returns the beat for a note at the specified y position.
         * May return an incorrect value when negative scrolls are used.
         *
         * @param {number} yp
         * @param {boolean} [ignoreScrolls] - Set to true to ignore scrolls
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getBeatFromYPos(yp: number, ignoreScrolls?: boolean): number;
        getColumnFromXPos(xp: number): number;
        /**
         * Returns the y position of the receptors after zooming.
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getActualReceptorYPos(): number;
        getEffectiveBeatsToPixelsRatio(): number;
        getPixelsToEffectiveBeatsRatio(): number;
        getSecondsToPixelsRatio(): number;
        getPixelsToSecondsRatio(): number;
        /**
         * Returns true if the chart is current at a negative scroll.
         *
         * @param {number} beat
         * @return {boolean}
         * @memberof ChartRenderer
         */
        isNegScroll(beat: number): boolean;
        /**
         * Returns the y position of the top of the screen
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getUpperBound(): number;
        /**
         * Returns the y position of the bottom of the screen
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getLowerBound(): number;
        findFirstOnScreenScroll(): ScrollTimingEvent;
        findLastOnScreenScroll(): ScrollTimingEvent;
        getTopOnScreenBeat(): number;
        getBottomOnScreenBeat(): number;
        isAreaOnScreen(y1: number, y2: number): boolean;
        getCurrentSpeedMult(): number;
        getScrollDirection(scrollValue: number): number;
        /**
         * Returns the minimum beat to render
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getUpperBoundBeat(): number;
        /**
         * Returns the maximum beat to render.
         *
         * @return {*}  {number}
         * @memberof ChartRenderer
         */
        getLowerBoundBeat(): number;
        /**
         * Tests if an object is in the selection sprite.
         *
         * @param {Container} object
         * @return {*}  {boolean}
         * @memberof ChartRenderer
         */
        selectionTest(object: DisplayObject): boolean;
        /**
         * Adds the selection and drag handlers to this object. Call this function when creating a new note object.
         *
         * @param {DisplayObject} object
         * @param {NotedataEntry} notedata
         * @memberof ChartRenderer
         */
        registerDragNote(object: DisplayObject, notedata: NotedataEntry): void;
        getNotefield(): Notefield;
        swapNoteskin(name: string): void;
        reloadNotefield(): void;
        getSelectionBounds(): SelectionBounds | undefined;
        shouldDisplayEditGUI(): boolean;
        shouldDisplayNoteSelection(note: NotedataEntry): boolean;
        shouldDisplayEventSelection(event: Cached<TimingEvent>): boolean;
    }
}
declare module "app/src/chart/gameTypes/noteskin/Noteskin" {
    import { Container, Texture } from "pixi.js";
    import { ChartRenderer } from "app/src/chart/ChartRenderer";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { VertCropSprite } from "app/src/util/VertCropSprite";
    import { StandardMissTimingWindow } from "app/src/chart/play/StandardMissTimingWindow";
    import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow";
    export const MISSING_TEX: Texture<import("pixi.js").Resource>;
    export interface NoteskinElementOptions {
        columnName: string;
        columnNumber: number;
        element: keyof NoteskinElements;
    }
    export interface NoteskinElementCreationOptions {
        note: NotedataEntry;
    }
    export type NoteskinElementCreationData = Partial<NoteskinElementCreationOptions> & {
        noteskin: Noteskin;
        columnName: string;
        columnNumber: number;
    };
    export type Generator<Element> = (data: NoteskinElementCreationData) => Element;
    export type NoteskinElements = {
        Tap: NoteskinSprite;
        Fake: NoteskinSprite;
        Lift: NoteskinSprite;
        Mine: NoteskinSprite;
        "Hold Inactive Head": NoteskinSprite;
        "Hold Inactive TopCap": NoteskinSprite;
        "Hold Inactive Body": NoteskinSprite;
        "Hold Inactive BottomCap": NoteskinHoldTail;
        "Hold Active Head": NoteskinSprite;
        "Hold Active TopCap": NoteskinSprite;
        "Hold Active Body": NoteskinSprite;
        "Hold Active BottomCap": NoteskinHoldTail;
        "Roll Inactive Head": NoteskinSprite;
        "Roll Inactive TopCap": NoteskinSprite;
        "Roll Inactive Body": NoteskinSprite;
        "Roll Inactive BottomCap": NoteskinHoldTail;
        "Roll Active Head": NoteskinSprite;
        "Roll Active TopCap": NoteskinSprite;
        "Roll Active Body": NoteskinSprite;
        "Roll Active BottomCap": NoteskinHoldTail;
        Receptor: NoteskinSprite;
        NoteFlash: NoteskinSprite;
    };
    export type NoteskinElementRedirect = {
        element: keyof NoteskinElements;
        columnName?: string;
        columnNumber?: number;
    };
    export type NoteskinElementGenerators = {
        [K in keyof NoteskinElements]: Generator<NoteskinElements[K]> | NoteskinElementRedirect;
    };
    export type NoteskinMetrics = typeof DEFAULT_METRICS;
    export interface NoteskinOptions {
        elements: Record<string, Partial<NoteskinElementGenerators>>;
        metrics?: Partial<NoteskinMetrics>;
        load?: (this: Noteskin, element: NoteskinElementOptions, data: NoteskinElementCreationData) => NoteskinSprite;
        init?: (renderer: ChartRenderer) => void;
        update?: (renderer: ChartRenderer) => void;
        hideIcons?: string[];
    }
    export interface NoteskinElement {
    }
    export type NoteskinSprite = NoteskinElement & Container;
    export type NoteskinHoldTail = NoteskinElement & VertCropSprite;
    export type NoteskinEvent = PressEvent | LiftEvent | GhostTapEvent | HitEvent | AvoidMineEvent | HitMineEvent | MissEvent | HoldOffEvent | HoldOnEvent | RollOffEvent | RollOnEvent | HoldLetGoEvent | HoldHeldEvent;
    export type NoteskinEventNames = NoteskinEvent["type"];
    type PressEvent = {
        type: "press";
        columnName: string;
        columnNumber: number;
    };
    type LiftEvent = {
        type: "lift";
        columnName: string;
        columnNumber: number;
    };
    type GhostTapEvent = {
        type: "ghosttap";
        columnName: string;
        columnNumber: number;
    };
    type HitEvent = {
        type: "hit";
        judgement: StandardTimingWindow;
        columnName: string;
        columnNumber: number;
    };
    type AvoidMineEvent = {
        type: "avoidmine";
        columnName: string;
        columnNumber: number;
    };
    type HitMineEvent = {
        type: "hitmine";
        columnName: string;
        columnNumber: number;
    };
    type MissEvent = {
        type: "miss";
        judgement: StandardMissTimingWindow;
        columnName: string;
        columnNumber: number;
    };
    type HoldOnEvent = {
        type: "holdon";
        columnName: string;
        columnNumber: number;
    };
    type HoldOffEvent = {
        type: "holdoff";
        columnName: string;
        columnNumber: number;
    };
    type RollOnEvent = {
        type: "rollon";
        columnName: string;
        columnNumber: number;
    };
    type RollOffEvent = {
        type: "rolloff";
        columnName: string;
        columnNumber: number;
    };
    type HoldLetGoEvent = {
        type: "letgo";
        columnName: string;
        columnNumber: number;
    };
    type HoldHeldEvent = {
        type: "held";
        columnName: string;
        columnNumber: number;
    };
    const DEFAULT_METRICS: {
        HoldBodyTopOffset: number;
        HoldBodyBottomOffset: number;
        RollBodyTopOffset: number;
        RollBodyBottomOffset: number;
    };
    export class Noteskin {
        protected readonly renderer: ChartRenderer;
        protected readonly options: NoteskinOptions;
        protected objects: NoteskinSprite[];
        protected readonly updateHooks: Set<{
            item: NoteskinSprite;
            cb: (renderer: ChartRenderer) => void;
        }>;
        protected readonly hooks: {
            [Name in NoteskinEventNames]?: Set<{
                item: NoteskinSprite;
                cb: (event: Extract<NoteskinEvent, {
                    type: Name;
                }>) => void;
            }>;
        };
        readonly metrics: NoteskinMetrics;
        constructor(renderer: ChartRenderer, options: NoteskinOptions);
        update(renderer: ChartRenderer): void;
        getPlaceholderSprite(): NoteskinSprite;
        getBlankSprite(): NoteskinSprite;
        getElement(element: NoteskinElementOptions, options?: Partial<NoteskinElementCreationOptions>): NoteskinSprite;
        loadElement(element: NoteskinElementOptions, options?: Partial<NoteskinElementCreationOptions>): NoteskinSprite;
        followRedirs(element: NoteskinElementOptions): Generator<NoteskinSprite> | undefined;
        on<Event extends NoteskinEventNames>(item: NoteskinSprite, event: Event, cb: (event: Extract<NoteskinEvent, {
            type: Event;
        }>) => void): void;
        onUpdate(item: NoteskinSprite, cb: (renderer: ChartRenderer) => void): void;
        broadcast<Type extends NoteskinEventNames>(event: Extract<NoteskinEvent, {
            type: Type;
        }>): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/default/ModelRenderer" {
    import { BaseTexture, Container, Geometry, Mesh, RenderTexture, Shader, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static arrowPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowBodyGeom: Geometry;
        static arrowFrameGeom: Geometry;
        static liftBodyGeom: Geometry;
        static mineBodyGeom: Geometry;
        static arrowFrameTex: RenderTexture;
        static arrowFrame: Mesh<Shader>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/default/NoteFlash" {
    import { Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: Sprite;
        standard: Record<string, Sprite>;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/_template/HoldBody" {
    import { IDestroyOptions, Texture, TilingSprite } from "pixi.js";
    export class HoldBody extends TilingSprite {
        constructor(texture: Texture, holdWidth?: number);
    }
    export class AnimatedHoldBody extends HoldBody {
        private _playing;
        private _autoUpdate;
        private _isConnectedToTicker;
        private _tickerUpdate;
        private _currentTime;
        private _textures;
        private _previousFrame;
        onComplete: (() => void) | null;
        onLoop: (() => void) | null;
        onFrameChange: ((frame: number) => void) | null;
        animationSpeed: number;
        loop: boolean;
        updateAnchor: boolean;
        constructor(textures: Texture[], holdWidth: number);
        stop(): void;
        play(): void;
        gotoAndStop(frameNumber: number): void;
        gotoAndPlay(frameNumber: number): void;
        update(deltaTime: number): void;
        updateTexture(): void;
        destroy(options?: IDestroyOptions | boolean): void;
        get totalFrames(): number;
        get textures(): Texture[];
        set textures(value: Texture[]);
        get currentFrame(): number;
        set currentFrame(value: number);
        get playing(): boolean;
        get autoUpdate(): boolean;
        set autoUpdate(value: boolean);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/default/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/default/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": () => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": () => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
    };
    export default _default;
}
declare module "app/src/chart/gameTypes/noteskin/dance/cf-chrome/ModelRenderer" {
    import { BaseTexture, Container, Geometry, Mesh, RenderTexture, Shader, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static arrowBodyTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowFrameChromeTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowFrameBlackTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftFrameChromeTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftFrameBlackTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowBodyGeom: Geometry;
        static arrowFrameBlackGeom: Geometry;
        static arrowFrameChromeGeom: Geometry;
        static liftFrameBlackGeom: Geometry;
        static liftFrameChromeGeom: Geometry;
        static mineBodyGeom: Geometry;
        static arrowFrameTex: RenderTexture;
        static arrowChrome: Mesh<Shader>;
        static arrowBlack: Mesh<Shader>;
        static arrowFrameContainer: Container<import("pixi.js").DisplayObject>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftChrome: Mesh<Shader>;
        static liftBlack: Mesh<Shader>;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/cf-chrome/NoteFlash" {
    import { Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: Sprite;
        standard: Record<string, Sprite>;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/cf-chrome/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/cf-chrome/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_1: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": () => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": () => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
    };
    export default _default_1;
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-note/ModelRenderer" {
    import { BaseTexture, Container, Geometry, Mesh, RenderTexture, Shader, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static arrowPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftQuantsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowBodyGeom: Geometry;
        static arrowFrameGeom: Geometry;
        static liftBodyGeom: Geometry;
        static liftFrameGeom: Geometry;
        static mineBodyGeom: Geometry;
        static arrowFrameTex: RenderTexture;
        static arrowFrame: Mesh<Shader>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-note/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: AnimatedSprite;
        bright: Sprite;
        dim: Sprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-note/Noteskin" {
    import { AnimatedSprite, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/ddr-note/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_2: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Hold Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
        hideIcons: string[];
    };
    export default _default_2;
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-note-itg/ModelRenderer" {
    import { BaseTexture, Container, Geometry, Mesh, RenderTexture, Shader, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static arrowPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftQuantsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowBodyGeom: Geometry;
        static arrowFrameGeom: Geometry;
        static liftBodyGeom: Geometry;
        static liftFrameGeom: Geometry;
        static mineBodyGeom: Geometry;
        static arrowFrameTex: RenderTexture;
        static arrowFrame: Mesh<Shader>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-note-itg/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: AnimatedSprite;
        bright: Sprite;
        dim: Sprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-note-itg/Noteskin" {
    import { AnimatedSprite, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/ddr-note-itg/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_3: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Hold Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
    };
    export default _default_3;
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow/ModelRenderer" {
    import { BaseTexture, Container, Geometry, Mesh, RenderTexture, Shader, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static arrowPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftQuantsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowBodyGeom: Geometry;
        static arrowFrameGeom: Geometry;
        static liftBodyGeom: Geometry;
        static liftFrameGeom: Geometry;
        static mineBodyGeom: Geometry;
        static arrowFrameTex: RenderTexture;
        static arrowFrame: Mesh<Shader>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: AnimatedSprite;
        bright: Sprite;
        dim: Sprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow/Noteskin" {
    import { AnimatedSprite, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_4: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Hold Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Roll Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
        hideIcons: string[];
    };
    export default _default_4;
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow-itg/ModelRenderer" {
    import { BaseTexture, Container, Geometry, Mesh, RenderTexture, Shader, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static arrowPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftQuantsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowBodyGeom: Geometry;
        static arrowFrameGeom: Geometry;
        static liftBodyGeom: Geometry;
        static liftFrameGeom: Geometry;
        static mineBodyGeom: Geometry;
        static arrowFrameTex: RenderTexture;
        static arrowFrame: Mesh<Shader>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow-itg/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: AnimatedSprite;
        bright: Sprite;
        dim: Sprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow-itg/Noteskin" {
    import { AnimatedSprite, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/ddr-rainbow-itg/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_5: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Hold Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Roll Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
        hideIcons: string[];
    };
    export default _default_5;
}
declare module "app/src/chart/gameTypes/noteskin/dance/metal/ModelRenderer" {
    import { BaseTexture, Container, Geometry, Mesh, RenderTexture, Shader, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static arrowPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static liftPartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static arrowBodyGeom: Geometry;
        static arrowFrameGeom: Geometry;
        static liftBodyGeom: Geometry;
        static mineBodyGeom: Geometry;
        static arrowFrameTex: RenderTexture;
        static arrowFrame: Mesh<Shader>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineConainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/metal/NoteFlash" {
    import { Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: Sprite;
        standard: Record<string, Sprite>;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/metal/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/metal/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_6: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": () => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": () => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
    };
    export default _default_6;
}
declare module "app/src/chart/gameTypes/noteskin/dance/pastel/ModelRenderer" {
    import { BaseTexture, Container, Geometry, RenderTexture } from "pixi.js";
    import { App } from "app/src/App";
    export class ModelRenderer {
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static mineBodyGeom: Geometry;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/pastel/NoteFlash" {
    import { Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        standard: Sprite;
        hold: Sprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/pastel/Noteskin" {
    import { AnimatedSprite, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/pastel/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_7: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                Mine: () => Sprite;
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": {
                    element: "Hold Active Body";
                };
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": {
                    element: "Hold Active BottomCap";
                };
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": {
                    element: "Roll Active Body";
                };
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": {
                    element: "Roll Active BottomCap";
                };
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
    };
    export default _default_7;
}
declare module "app/src/chart/gameTypes/noteskin/dance/dividebyzero/NoteFlash" {
    import { AnimatedSprite, Container } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        hold: AnimatedSprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/dividebyzero/Noteskin" {
    import { AnimatedSprite, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/dividebyzero/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_8: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                Mine: (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                "Hold Active Head": (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": {
                    element: "Hold Active Body";
                };
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": {
                    element: "Hold Active BottomCap";
                };
                "Roll Active Head": {
                    element: "Hold Active Head";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": {
                    element: "Roll Active Body";
                };
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": {
                    element: "Roll Active BottomCap";
                };
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        hideIcons: string[];
    };
    export default _default_8;
}
declare module "app/src/chart/gameTypes/noteskin/dance/subtractbyzero/NoteFlash" {
    import { AnimatedSprite, Container } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        hold: AnimatedSprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/subtractbyzero/Noteskin" {
    import { AnimatedSprite, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/subtractbyzero/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_9: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                Mine: (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedSprite;
                "Hold Active Head": (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": {
                    element: "Hold Active Body";
                };
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": {
                    element: "Hold Active BottomCap";
                };
                "Roll Active Head": {
                    element: "Hold Active Head";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": {
                    element: "Roll Active Body";
                };
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": {
                    element: "Roll Active BottomCap";
                };
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        hideIcons: string[];
    };
    export default _default_9;
}
declare module "app/src/chart/gameTypes/noteskin/dance/sm4/ModelRenderer" {
    import { BaseTexture, Container, Geometry, RenderTexture, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static mineBodyGeom: Geometry;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/sm4/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: AnimatedSprite;
        standard: Sprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/sm4/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/sm4/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_10: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": () => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": () => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
    };
    export default _default_10;
}
declare module "app/src/chart/gameTypes/noteskin/dance/sm4-bold/ModelRenderer" {
    import { BaseTexture, Container, Geometry, RenderTexture, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class ModelRenderer {
        static minePartsTex: BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions>;
        static mineBodyGeom: Geometry;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        static mineTex: RenderTexture;
        static mineContainer: Container<import("pixi.js").DisplayObject>;
        static liftTex: RenderTexture;
        static liftContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/sm4-bold/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: AnimatedSprite;
        standard: Sprite;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/sm4-bold/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/sm4-bold/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    const _default_11: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": () => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": () => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
    };
    export default _default_11;
}
declare module "app/src/chart/gameTypes/noteskin/dance/starlight-vivid/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        holdExplosion: Sprite;
        particles: Sprite;
        mine: AnimatedSprite;
        standard: Record<string, Sprite>;
        anims: Set<string>;
        particleAnim?: string;
        mineAnim?: string;
        constructor(noteskin: Noteskin, col: number, columnName: string);
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/starlight-vivid/NoteRenderer" {
    import { Container, RenderTexture, Sprite } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class NoteRenderer {
        static arrowFrameTex: RenderTexture;
        static arrowFrameContainer: Container<import("pixi.js").DisplayObject>;
        static arrowTex: RenderTexture;
        static arrowContainer: Container<import("pixi.js").DisplayObject>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/dance/starlight-vivid/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/dance/starlight-vivid/NoteFlash";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    export const rotationMap: Record<string, number>;
    const _default_12: {
        elements: {
            Left: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                "Hold Active Head": () => Sprite;
                "Hold Inactive Head": () => Sprite;
                "Hold Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Hold Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Active Head": () => Sprite;
                "Roll Inactive Head": () => Sprite;
                "Roll Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Roll Inactive Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldBody;
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
                "Roll Inactive BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
    };
    export default _default_12;
}
declare module "app/src/chart/gameTypes/noteskin/pump/default/NoteRenderer" {
    import { AnimatedSprite, Container, RenderTexture, Sprite, Texture } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export const tapTex: Record<string, Texture[]>;
    export class NoteRenderer {
        static noteTex: RenderTexture;
        static noteContainer: Container<AnimatedSprite>;
        static rollTex: RenderTexture;
        static rollContainer: Container<AnimatedSprite>;
        static mineTex: RenderTexture;
        static mine: AnimatedSprite;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static createSprite(container: Container, column: string, texes: Record<string, Texture[]>): void;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined, columnName: string): Texture<import("pixi.js").CanvasResource> | undefined;
        static setRollTex(arrow: Sprite, columnName: string): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/pump/default/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        press: Sprite;
        pressAnim: string | undefined;
        hitContainer: Container<import("pixi.js").DisplayObject>;
        tap: Sprite;
        note: AnimatedSprite;
        flash: AnimatedSprite;
        hitAnim: string | undefined;
        anims: Set<string>;
        constructor(noteskin: Noteskin, colName: string, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/pump/default/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { AnimatedHoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { AnimatedHoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/pump/default/NoteFlash";
    export const texOrder: string[];
    const _default_13: {
        elements: {
            DownLeft: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedHoldBody;
                "Hold Inactive Body": {
                    element: "Hold Active Body";
                };
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedHoldTail;
                "Hold Inactive BottomCap": {
                    element: "Hold Active BottomCap";
                };
                "Roll Active Head": (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                "Roll Inactive Head": {
                    element: "Roll Active Head";
                };
                "Roll Active Body": {
                    element: "Hold Active Body";
                };
                "Roll Inactive Body": {
                    element: "Hold Active Body";
                };
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": {
                    element: "Hold Active BottomCap";
                };
                "Roll Inactive BottomCap": {
                    element: "Hold Active BottomCap";
                };
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
    };
    export default _default_13;
}
declare module "app/src/chart/gameTypes/noteskin/pump/fourv2/NoteRenderer" {
    import { AnimatedSprite, Container, RenderTexture, Sprite, Texture } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export class NoteRenderer {
        static downLeftTex: RenderTexture;
        static downLeftContainer: Container<AnimatedSprite>;
        static centerTex: RenderTexture;
        static centerContainer: Container<AnimatedSprite>;
        static mineTex: RenderTexture;
        static mineContainer: Container<Sprite>;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static layoutRow(container: Container, tex: Texture, offset: number): void;
        static createMines(container: Container): void;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined, columnName: string): Texture<import("pixi.js").CanvasResource> | undefined;
        static getNoteRow(noteType: string): 0 | 1 | 2;
    }
}
declare module "app/src/chart/gameTypes/noteskin/_template/HoldTopCap" {
    import { IDestroyOptions, Sprite, Texture } from "pixi.js";
    export class HoldTopCap extends Sprite {
        constructor(texture: Texture, holdWidth?: number, reverse?: boolean);
    }
    export class AnimatedHoldTopCap extends HoldTopCap {
        private _playing;
        private _autoUpdate;
        private _isConnectedToTicker;
        private _tickerUpdate;
        private _currentTime;
        private _textures;
        private _previousFrame;
        onComplete: (() => void) | null;
        onLoop: (() => void) | null;
        onFrameChange: ((frame: number) => void) | null;
        animationSpeed: number;
        loop: boolean;
        updateAnchor: boolean;
        constructor(textures: Texture[], holdWidth: number);
        stop(): void;
        play(): void;
        gotoAndStop(frameNumber: number): void;
        gotoAndPlay(frameNumber: number): void;
        update(deltaTime: number): void;
        updateTexture(): void;
        destroy(options?: IDestroyOptions | boolean): void;
        get totalFrames(): number;
        get textures(): Texture[];
        set textures(value: Texture[]);
        get currentFrame(): number;
        set currentFrame(value: number);
        get playing(): boolean;
        get autoUpdate(): boolean;
        set autoUpdate(value: boolean);
    }
}
declare module "app/src/chart/gameTypes/noteskin/pump/fourv2/NoteFlash" {
    import { Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        standard: Sprite;
        standardAnim: string | undefined;
        anims: Set<string>;
        constructor(noteskin: Noteskin, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/pump/fourv2/Noteskin" {
    import { Sprite } from "pixi.js";
    import { HoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { HoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    import { HoldTopCap } from "app/src/chart/gameTypes/noteskin/_template/HoldTopCap";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/pump/fourv2/NoteFlash";
    const _default_14: {
        elements: {
            DownLeft: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": () => HoldBody;
                "Hold Inactive Body": () => HoldBody;
                "Hold Active TopCap": () => HoldTopCap;
                "Hold Inactive TopCap": () => HoldTopCap;
                "Hold Active BottomCap": () => HoldTail;
                "Hold Inactive BottomCap": () => HoldTail;
                "Roll Active Head": {
                    element: "Tap";
                };
                "Roll Inactive Head": {
                    element: "Tap";
                };
                "Roll Active Body": () => HoldBody;
                "Roll Inactive Body": () => HoldBody;
                "Roll Active TopCap": () => HoldTopCap;
                "Roll Inactive TopCap": () => HoldTopCap;
                "Roll Active BottomCap": () => HoldTail;
                "Roll Inactive BottomCap": () => HoldTail;
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        hideIcons: string[];
    };
    export default _default_14;
}
declare module "app/src/chart/gameTypes/noteskin/pump/prime/NoteRenderer" {
    import { AnimatedSprite, Container, RenderTexture, Sprite, Texture } from "pixi.js";
    import { App } from "app/src/App";
    import { NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export const tapTex: Record<string, Texture[]>;
    export class NoteRenderer {
        static noteTex: RenderTexture;
        static noteContainer: Container<AnimatedSprite>;
        static rollTex: RenderTexture;
        static rollContainer: Container<AnimatedSprite>;
        static mineTex: RenderTexture;
        static mine: AnimatedSprite;
        private static loaded;
        static initArrowTex(): Promise<void>;
        static createSprite(container: Container, column: string, texes: Record<string, Texture[]>): void;
        static setArrowTexTime(app: App): void;
        static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined, columnName: string): Texture<import("pixi.js").CanvasResource> | undefined;
        static setRollTex(arrow: Sprite, columnName: string): void;
    }
}
declare module "app/src/chart/gameTypes/noteskin/pump/prime/NoteFlash" {
    import { AnimatedSprite, Container, Sprite } from "pixi.js";
    import { Noteskin } from "app/src/chart/gameTypes/noteskin/Noteskin";
    export class NoteFlashContainer extends Container {
        press: Sprite;
        pressAnim: string | undefined;
        hitContainer: Container<import("pixi.js").DisplayObject>;
        tap: Sprite;
        note: AnimatedSprite;
        flash: AnimatedSprite;
        hitAnim: string | undefined;
        anims: Set<string>;
        constructor(noteskin: Noteskin, colName: string, col: number);
    }
}
declare module "app/src/chart/gameTypes/noteskin/pump/prime/Noteskin" {
    import { Container, Sprite } from "pixi.js";
    import { AnimatedHoldBody } from "app/src/chart/gameTypes/noteskin/_template/HoldBody";
    import { AnimatedHoldTail } from "app/src/chart/gameTypes/noteskin/_template/HoldTail";
    import { NoteFlashContainer } from "app/src/chart/gameTypes/noteskin/pump/prime/NoteFlash";
    export const texOrder: string[];
    const _default_15: {
        elements: {
            DownLeft: {
                Receptor: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Container<import("pixi.js").DisplayObject>;
                Tap: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                Fake: {
                    element: "Tap";
                };
                Lift: {
                    element: "Tap";
                };
                Mine: {
                    element: "Tap";
                };
                NoteFlash: (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => NoteFlashContainer;
                "Hold Active Head": {
                    element: "Tap";
                };
                "Hold Inactive Head": {
                    element: "Tap";
                };
                "Hold Active Body": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedHoldBody;
                "Hold Inactive Body": {
                    element: "Hold Active Body";
                };
                "Hold Active TopCap": () => Sprite;
                "Hold Inactive TopCap": () => Sprite;
                "Hold Active BottomCap": (opt: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => AnimatedHoldTail;
                "Hold Inactive BottomCap": {
                    element: "Hold Active BottomCap";
                };
                "Roll Active Head": (options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => Sprite;
                "Roll Inactive Head": {
                    element: "Roll Active Head";
                };
                "Roll Active Body": {
                    element: "Hold Active Body";
                };
                "Roll Inactive Body": {
                    element: "Hold Active Body";
                };
                "Roll Active TopCap": () => Sprite;
                "Roll Inactive TopCap": () => Sprite;
                "Roll Active BottomCap": {
                    element: "Hold Active BottomCap";
                };
                "Roll Inactive BottomCap": {
                    element: "Hold Active BottomCap";
                };
            };
        };
        load: (this: import("app/src/chart/gameTypes/noteskin/Noteskin").Noteskin, element: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementOptions, options: import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinElementCreationData) => import("app/src/chart/gameTypes/noteskin/Noteskin").NoteskinSprite;
        init(): void;
        update(renderer: import("app/src/chart/ChartRenderer").ChartRenderer): void;
        metrics: {
            HoldBodyBottomOffset: number;
            RollBodyBottomOffset: number;
        };
    };
    export default _default_15;
}
declare module "app/src/chart/gameTypes/noteskin/NoteskinRegistry" {
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    import { NoteskinOptions } from "app/src/chart/gameTypes/noteskin/Noteskin";
    interface RegistryData {
        id: string;
        gameTypes: string[];
        load: () => Promise<NoteskinOptions>;
        preview: string;
        title?: string;
        subtitle?: string;
    }
    export class NoteskinRegistry {
        private static noteskins;
        static register(options: RegistryData): void;
        static getNoteskin(gameType: GameType, id: string): Promise<NoteskinOptions | undefined>;
        static getNoteskinData(gameType: GameType, id: string): RegistryData | undefined;
        static getNoteskins(): Map<string, Map<string, RegistryData>>;
        static getPreviewUrl(gameType: GameType, id: string): string;
    }
}
declare module "app/src/gui/window/NoteskinWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class NoteskinWindow extends Window {
        app: App;
        private grid;
        private lastGameType;
        constructor(app: App);
        initView(): void;
        loadGrid(): void;
        removeAllSelections(): void;
        filterGrid(query: string): void;
        containsQuery(query: string, string: string | undefined): boolean;
    }
}
declare module "app/src/gui/window/OffsetWindow" {
    import { Howl } from "howler/dist/howler.core.min.js";
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    interface TickLine {
        time: number;
        beat: number;
    }
    interface ResultLine {
        startTime: number;
        offset: number;
    }
    export class OffsetWindow extends Window {
        app: App;
        metronomeInterval: NodeJS.Timeout;
        startTime: number;
        me_high: Howl;
        me_low: Howl;
        tickLines: TickLine[];
        resultLines: ResultLine[];
        previousOffsets: number[];
        keyHandler: (e: KeyboardEvent) => void;
        constructor(app: App);
        initView(): void;
        drawEQ(canvas: HTMLCanvasElement): () => void;
        onClose(): void;
    }
}
declare module "app/src/gui/window/SMPropertiesWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class SMPropertiesWindow extends Window {
        app: App;
        private changeHandler;
        constructor(app: App);
        onClose(): void;
        initView(): void;
    }
}
declare module "app/src/data/TimingDataWindowData" {
    import { App } from "app/src/App";
    import { TimingData } from "app/src/chart/sm/TimingData";
    type TimingDataWindowInputs = {
        data: any[];
    };
    type TimingDataWindowElement = {
        create: (this: TimingDataWindowInputs, app: App) => HTMLElement;
        update: (this: TimingDataWindowInputs, timingData: TimingData, beat: number) => void;
    };
    type TimingDataWindowData = {
        title: string;
        element: TimingDataWindowElement;
    };
    export const TIMING_WINDOW_DATA: {
        [key: string]: TimingDataWindowData;
    };
}
declare module "app/src/gui/window/TimingDataWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class TimingDataWindow extends Window {
        app: App;
        private lastBeat;
        private readonly interval;
        private changeHandler;
        private data;
        constructor(app: App);
        onClose(): void;
        initView(): void;
        setData(): void;
    }
}
declare module "app/src/data/UserOptionsWindowData" {
    import { App } from "app/src/App";
    export type UserOption = UserOptionGroup | UserOptionSubgroup | UserOptionItem;
    export interface UserOptionGroup {
        type: "group";
        id: string;
        label: string;
        children: UserOption[];
        disable?: (app: App) => boolean;
    }
    interface UserOptionSubgroup {
        type: "subgroup";
        label?: string;
        children: UserOption[];
        disable?: (app: App) => boolean;
    }
    interface UserOptionItem {
        type: "item";
        id: string;
        label: string;
        tooltip?: string;
        input: UserOptionInput<any>;
        disable?: (app: App) => boolean;
    }
    interface UserOptionTextInput {
        type: "text";
        transformers?: {
            serialize: (value: string) => string;
            deserialize: (value: string) => string;
        };
        onChange?: (app: App, value: string) => void;
    }
    type UserOptionDropdownInput<T> = {
        type: "dropdown";
        items: readonly string[];
        advanced: false;
        onChange?: (app: App, value: string | number) => void;
    } | {
        type: "dropdown";
        items: readonly number[];
        advanced: false;
        onChange?: (app: App, value: string | number) => void;
    } | {
        type: "dropdown";
        items: T[];
        advanced: true;
        transformers: {
            serialize: (value: string | number | boolean) => T;
            deserialize: (value: T) => string | number | boolean;
        };
        onChange?: (app: App, value: string | number | boolean) => void;
    };
    interface UserOptionNumberInput {
        type: "number";
        step: number;
        precision?: number;
        minPrecision?: number;
        min?: number;
        max?: number;
        transformers?: {
            serialize: (value: number) => number;
            deserialize: (value: number) => number;
        };
        onChange?: (app: App, value: number) => void;
    }
    interface UserOptionSliderInput {
        type: "slider";
        step?: number;
        min?: number;
        max?: number;
        hardMax?: number;
        hardMin?: number;
        transformers?: {
            serialize: (value: number) => number;
            deserialize: (value: number) => number;
        };
        onChange?: (app: App, value: number) => void;
    }
    interface UserOptionCheckboxInput {
        type: "checkbox";
        onChange?: (app: App, value: boolean) => void;
    }
    interface UserOptionColorInput {
        type: "color";
        onChange?: (app: App, value: string) => void;
    }
    type UserOptionInput<T> = UserOptionTextInput | UserOptionDropdownInput<T> | UserOptionNumberInput | UserOptionCheckboxInput | UserOptionSliderInput | UserOptionColorInput;
    export const USER_OPTIONS_WINDOW_DATA: UserOption[];
}
declare module "app/src/gui/window/UserOptionsWindow" {
    import { App } from "app/src/App";
    import { Window } from "app/src/gui/window/Window";
    export class UserOptionsWindow extends Window {
        app: App;
        private observer?;
        private sectionContainer?;
        constructor(app: App);
        initView(): void;
        private createOptions;
        private makeOption;
        private filterOptions;
        private createEmptyGroup;
        onClose(): void;
    }
}
declare module "app/src/data/KeybindData" {
    import { App } from "app/src/App";
    export interface Keybind {
        label: string;
        bindLabel?: string;
        combos: KeyCombo[];
        visible?: boolean | ((app: App) => boolean);
        disabled: boolean | ((app: App) => boolean);
        disableRepeat?: boolean;
        preventDefault?: boolean;
        callback: (app: App) => void;
        callbackKeyUp?: (app: App) => void;
    }
    export interface KeyCombo {
        key: string;
        mods: Modifier[];
    }
    export enum Modifier {
        SHIFT = "Shift",
        CTRL = "Ctrl",
        ALT = "Alt",
        META = "Command"
    }
    export const DEF_MOD: Modifier;
    export const MODIFIER_ASCII: {
        [key: string]: string;
    };
    export const SPECIAL_KEYS: {
        [key: string]: string;
    };
    export const KEY_DISPLAY_OVERRIDES: {
        [key: string]: string;
    };
    export const MODPROPS: ["ctrlKey", "altKey", "shiftKey", "metaKey"];
    export const MODORDER: Modifier[];
    export const KEYBIND_DATA: {
        [key: string]: Keybind;
    };
}
declare module "app/src/gui/notification/UpdateNotification" {
    interface UpdateNotificationOptions {
        title: string;
        desc: string;
        options: UpdateOption[];
    }
    interface UpdateOption {
        label: string;
        callback?: (popup: UpdateNotification) => void;
        type: "delete" | "confirm" | "default";
    }
    export abstract class UpdateNotification {
        static popup?: HTMLDivElement;
        protected static build(opt: UpdateNotificationOptions): void;
        static close(): void;
    }
}
declare module "app/src/gui/notification/AppUpdateNotification" {
    import { UpdateNotification } from "app/src/gui/notification/UpdateNotification";
    export class AppUpdateNotification extends UpdateNotification {
        static open(versionName: string, downloadLink: string): void;
    }
}
declare module "app/src/gui/notification/CoreUpdateNotification" {
    import { UpdateNotification } from "app/src/gui/notification/UpdateNotification";
    export class CoreUpdateNotification extends UpdateNotification {
        static open(callback: () => void): void;
    }
}
declare module "app/src/gui/notification/OfflineUpdateNotification" {
    import { UpdateNotification } from "app/src/gui/notification/UpdateNotification";
    export class OfflineUpdateNotification extends UpdateNotification {
        static open(): void;
    }
}
declare module "app/src/util/Ascii85" {
    import { PartialNotedata } from "app/src/chart/sm/NoteTypes";
    import { Cached, TimingEvent } from "app/src/chart/sm/TimingTypes";
    export function a85encode(data: string | ArrayBuffer | number[], foldspaces?: boolean, pad?: boolean, adobe?: boolean): number[];
    export function a85decode(data: string | ArrayBuffer, adobe?: boolean, ignorechars?: string): false | number[];
    export function unpackValue(bytes: number[]): number;
    export function packValue(value: number): number[];
    export function decodeNotes(data: string): PartialNotedata | undefined;
    export function encodeNotes(notes: PartialNotedata): string;
    export function encodeTempo(events: Cached<TimingEvent>[]): string;
    export function encodeAVTempo(events: Cached<TimingEvent>[]): string;
    export function encodeSMETempo(events: TimingEvent[]): string;
    export function decodeTempo(data: string): TimingEvent[] | undefined;
    export function decodeAVTempo(data: string): TimingEvent[] | undefined;
    export function decodeSMETempo(data: string): TimingEvent[] | undefined;
}
declare module "app/src/util/SchedulableSoundEffect" {
    export interface SchedulableSoundEffectOptions {
        src: string;
        volume?: number;
        rate?: number;
    }
    export class SchedulableSoundEffect {
        private readonly _gainNode;
        private _audioContext;
        private _sources;
        private _rate;
        private _buffer;
        private _volume;
        private _destroyed;
        loaded: Promise<void>;
        constructor(options: SchedulableSoundEffectOptions);
        /**
         * Destroys this instance and frees up memory. Unbinds all bound waveforms.
         * Destroyed instances cannot be used again.
         * @memberof ChartAudio
         */
        destroy(): void;
        private decodeData;
        /**
         * Sets the volume of this audio. 1 is 100%.
         *
         * @param {number} volume
         * @memberof ChartAudio
         */
        volume(volume: number): void;
        /**
         * Sets the playback rate of this audio. 1 is 100%.
         * Changing the rate will change the pitch.
         * @param {number} rate
         * @memberof ChartAudio
         */
        rate(rate: number): void;
        /**
         * Starts playing this audio.
         *
         * @memberof ChartAudio
         */
        play(offset: number): void;
        stop(): void;
        getBuffer(): AudioBuffer;
    }
}
declare module "app/src/chart/audio/ChartAudio" {
    class ToggleableBiquadFilterNode extends BiquadFilterNode {
        enabled: boolean;
        static create(filter: BiquadFilterNode): ToggleableBiquadFilterNode;
    }
    export class ChartAudio {
        private readonly _audioAnalyzer;
        private readonly _filteredAudioAnalyzer;
        private readonly _freqData;
        private readonly _filteredFreqData;
        private readonly _gainNode;
        private readonly type;
        private _audioContext;
        private _source?;
        private _playbackTime;
        private _startTimestamp;
        private _rate;
        private _isPlaying;
        private _buffer;
        private _filteredBuffer;
        private _loadedBuffer;
        private _delay?;
        private _loadListeners;
        private _updateListeners;
        private _volume;
        private _destroyed;
        private _renderTimeout?;
        private _filters;
        private _filtersEnabled;
        onStop?: () => void;
        loaded: Promise<void>;
        constructor(data?: ArrayBuffer, type?: string);
        /**
         * Renders the specified AudioBuffer to the buffer of this ChartAudio
         *
         * @private
         * @param {(AudioBuffer | undefined)} buffer The buffer to render.
         * @return {*}  {Promise<void>}
         * @memberof ChartAudio
         */
        private renderBuffer;
        /**
         * Renders the specified AudioBuffer to the buffer of this ChartAudio, applying filters set to this instance.
         *
         * @private
         * @param {(AudioBuffer | undefined)} buffer The buffer to render.
         * @return {*}  {Promise<void>}
         * @memberof ChartAudio
         */
        private renderFilteredBuffer;
        private createFilter;
        getFilters(): ToggleableBiquadFilterNode[];
        getFilter(filterIndex: number): ToggleableBiquadFilterNode;
        updateFilter(filterIndex: number, properties: {
            Q?: number;
            gain?: number;
            frequency?: number;
        }): void;
        enableFilter(filterIndex: number): void;
        disableFilter(filterIndex: number): void;
        hasFilters(): boolean;
        /**
         * Add a listener that fires when the audio buffer is loaded.
         * @memberof ChartAudio
         */
        onLoad(callback: () => void): void;
        /**
         * Removes a listener that fires when the audio buffer is loaded.
         * @memberof ChartAudio
         */
        offLoad(callback: () => void): void;
        /**
         * Add a listener that fires when the filters are updated or the audio buffer is loaded.
         * @memberof ChartAudio
         */
        onUpdate(callback: () => void): void;
        /**
         * Removes a listener that fires when the filters are updated or the audio buffer is loaded.
         * @memberof ChartAudio
         */
        offUpdate(callback: () => void): void;
        /**
         * Returns the length of the audio in seconds.
         *
         * @return {*} {number}
         * @memberof ChartAudio
         */
        getSongLength(): number;
        /**
         * Returns an array containing the byte frequency data.
         *
         * @return {*}  {Uint8Array}
         * @memberof ChartAudio
         */
        getFrequencyData(): Uint8Array;
        /**
         * Returns an array containing the byte frequency data after audio filtering.
         *
         * @return {*}  {Uint8Array}
         * @memberof ChartAudio
         */
        getFilteredFrequencyData(): Uint8Array;
        /**
         * Returns the sample rate of the audio
         *
         * @return {*}  {number}
         * @memberof ChartAudio
         */
        getSampleRate(): number;
        /**
         * Returns the FFT size of the audio analyzer.
         *
         * @return {*}  {number}
         * @memberof ChartAudio
         */
        getFFTSize(): number;
        /**
         * Returns the raw audio data. Each channel has its own Float32Array.
         *
         * @return {*}  {number[]}
         * @memberof ChartAudio
         */
        getRawData(): Float32Array[];
        /**
         * Returns the filtered raw audio data. Each channel has its own Float32Array.
         *
         * @return {*}  {number[]}
         * @memberof ChartAudio
         */
        getFilteredRawData(): Float32Array[];
        getBuffer(): AudioBuffer;
        /**
         * Returns whether the audio is currently playing
         *
         * @return {*}  {boolean}
         * @memberof ChartAudio
         */
        isPlaying(): boolean;
        reload(): void;
        /**
         * Destroys this instance and frees up memory. Unbinds all bound waveforms.
         * Destroyed instances cannot be used again.
         * @memberof ChartAudio
         */
        destroy(): void;
        getFrequencyResponse(frequencies: number[]): number[];
        private callLoadListeners;
        private callUpdateListeners;
        private decodeData;
        private initSource;
        /**
         * Sets the volume of this audio. 1 is 100%.
         *
         * @param {number} volume
         * @memberof ChartAudio
         */
        volume(volume: number): void;
        /**
         * Sets the playback rate of this audio. 1 is 100%.
         * Changing the rate will change the pitch.
         * @param {number} rate
         * @memberof ChartAudio
         */
        rate(rate: number): void;
        /**
         * Starts playing this audio.
         *
         * @memberof ChartAudio
         */
        play(): void;
        /**
         * Seeks the audio to the specified location. If no time is provided, returns the current playback time.
         * @return {*}  {number}
         * @memberof ChartAudio
         */
        seek(): number;
        seek(playbackTime: number): void;
        /**
         * Pauses this audio.
         *
         * @memberof ChartAudio
         */
        pause(): void;
        /**
         * Stops this audio.
         *
         * @param {boolean} [pause]
         * @memberof ChartAudio
         */
        stop(pause?: boolean): void;
    }
}
declare module "app/src/chart/play/GameplayStats" {
    import { ChartManager } from "app/src/chart/ChartManager";
    import { HoldNotedataEntry, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { HoldDroppedTimingWindow } from "app/src/chart/play/HoldDroppedTimingWindow";
    import { HoldTimingWindow } from "app/src/chart/play/HoldTimingWindow";
    import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow";
    import { TimingWindow } from "app/src/chart/play/TimingWindow";
    interface JudgementDataPoint {
        second: number;
        error: number | null;
        judgement: TimingWindow;
        notes: NotedataEntry[];
    }
    export class GameplayStats {
        private judgementCounts;
        private holdJudgementCounts;
        private dancePoints;
        private maxCumulativeDancePoints;
        private maxDancePoints;
        private chartManager;
        private readonly notedata;
        private dataPoints;
        private handlers;
        private combo;
        private missCombo;
        private maxCombo;
        private bestJudge?;
        constructor(chartManager: ChartManager);
        onJudge(handler: (error: number | null, judge: TimingWindow) => void): void;
        applyOffset(offset: number): void;
        /**
         * Adds a new judgement.
         *
         * @param {NotedataEntry[]} notes - The notes in this row.
         * @param {TimingWindow} judge - The judgement received
         * @param {number} error - The timing error in ms
         * @memberof GameplayStats
         */
        addDataPoint(notes: NotedataEntry[], judge: TimingWindow, error: number | null): void;
        /**
         * Add a new judgement for holds
         *
         * @param {HoldNotedataEntry} note - The hold note
         * @param {(HoldTimingWindow | HoldDroppedTimingWindow)} judge - The judgement received
         * @memberof GameplayStats
         */
        addHoldDataPoint(note: HoldNotedataEntry, judge: HoldTimingWindow | HoldDroppedTimingWindow): void;
        /**
         * Returns the score. 1 is 100%.
         *
         * @return {*}  {number}
         * @memberof GameplayStats
         */
        getScore(): number;
        /**
         * Returns the cumulative score.
         * Cumulative score is based on the number of arrows that have received a judgement.
         * 1 is 100%.
         *
         * @return {*}  {number}
         * @memberof GameplayStats
         */
        getCumulativeScore(): number;
        getDataPoints(): JudgementDataPoint[];
        getMedian(): number;
        /**
         * Returns the max combo.
         *
         * @return {*}  {number}
         * @memberof GameplayStats
         */
        getMaxCombo(): number;
        private calculateMaxDP;
        /**
         * Returns the number of judgements for a given judgement.
         *
         * @param {TimingWindow} window
         * @return {*}  {number}
         * @memberof GameplayStats
         */
        getCount(window: TimingWindow): number;
        /**
         * Returns the current combo
         *
         * @return {*}  {number}
         * @memberof GameplayStats
         */
        getCombo(): number;
        /**
         * Returns the current miss combo.
         *
         * @return {*}  {number}
         * @memberof GameplayStats
         */
        getMissCombo(): number;
        /**
         * Returns the best judgement received
         *
         * @return {*}  {(StandardTimingWindow | undefined)}
         * @memberof GameplayStats
         */
        getBestJudge(): StandardTimingWindow | undefined;
    }
}
declare module "app/src/chart/ChartManager" {
    import { Howl } from "howler/dist/howler.core.min.js";
    import { App } from "app/src/App";
    import { WidgetManager } from "app/src/gui/widget/WidgetManager";
    import { SchedulableSoundEffect } from "app/src/util/SchedulableSoundEffect";
    import { ChartRenderer } from "app/src/chart/ChartRenderer";
    import { ChartAudio } from "app/src/chart/audio/ChartAudio";
    import { GameplayStats } from "app/src/chart/play/GameplayStats";
    import { Chart } from "app/src/chart/sm/Chart";
    import { NoteType, Notedata, NotedataEntry, PartialNotedata, PartialNotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { Simfile } from "app/src/chart/sm/Simfile";
    import { Cached, TimingEvent } from "app/src/chart/sm/TimingTypes";
    interface Selection {
        notes: Notedata;
        shift?: {
            columnShift: number;
            beatShift: number;
        };
        inProgressNotes: Notedata;
    }
    interface EventSelection {
        shift?: {
            beatShift: number;
        };
        timingEvents: Cached<TimingEvent>[];
        inProgressTimingEvents: Cached<TimingEvent>[];
    }
    export enum EditMode {
        View = "View Mode",
        Edit = "Edit Mode",
        Play = "Play Mode",
        Record = "Record Mode"
    }
    export enum EditTimingMode {
        Off = 0,
        Edit = 1,
        Add = 2
    }
    export class ChartManager {
        app: App;
        chartAudio: ChartAudio;
        chartView?: ChartRenderer;
        widgetManager: WidgetManager;
        assistTick: SchedulableSoundEffect;
        me_high: SchedulableSoundEffect;
        me_low: SchedulableSoundEffect;
        mine: Howl;
        loadedSM?: Simfile;
        smPath: string;
        loadedChart?: Chart;
        selection: Selection;
        eventSelection: EventSelection;
        editTimingMode: EditTimingMode;
        private holdEditing;
        private editNoteTypeIndex;
        private partialScroll;
        private noteFlashIndex;
        private assistTickIndex;
        private lastMetronomeDivision;
        private lastMetronomeMeasure;
        private holdFlashes;
        private lastSong;
        private mode;
        private lastMode;
        private _beat;
        private cachedSecond;
        private cachedBeat;
        private readonly noChartTextA;
        private readonly noChartTextB;
        private readonly loadingText;
        private shiftPressed;
        private virtualClipboard;
        private lastAutoSave;
        startRegion?: number;
        endRegion?: number;
        gameStats?: GameplayStats;
        constructor(app: App);
        get beat(): number;
        set beat(beat: number);
        get time(): number;
        set time(time: number);
        /**
         * Loads the SM from the specified path. If no path is specified, the current SM is hidden.
         *
         * @param {string} [path]
         * @memberof ChartManager
         */
        loadSM(path?: string): Promise<void>;
        /**
         * Loads the specified chart. If no chart is loaded, the chart with the highest difficulty is loaded.
         *
         * @param {Chart} [chart]
         * @memberof ChartManager
         */
        loadChart(chart?: Chart): Promise<void>;
        /**
         * Loads the audio of the current chart.
         *
         * @memberof ChartManager
         */
        loadAudio(): Promise<void>;
        /**
         * Finds the audio file associated with the music path.
         * If none is found, attempt to find other audio files in the directory.
         *
         * @private
         * @param {string} musicPath
         * @return {Promise<FileSystemFileHandle | undefined>}
         * @memberof ChartManager
         */
        private getAudioHandle;
        getAudio(): ChartAudio;
        private updateSoundProperties;
        setRate(rate: number): void;
        setVolume(volume: number): void;
        setEffectVolume(volume: number): void;
        private setNoteIndex;
        playPause(): void;
        getClosestTick(beat: number, quant: number): number;
        snapToNearestTick(beat: number): void;
        snapToPreviousTick(): void;
        snapToNextTick(): void;
        previousSnap(): void;
        nextSnap(): void;
        private getSnapIndex;
        private removeDuplicateBeats;
        private getRows;
        /**
         * Seeks to the previous note.
         *
         * @memberof ChartManager
         */
        previousNote(): void;
        /**
         * Seeks to the next note.
         *
         * @memberof ChartManager
         */
        nextNote(): void;
        /**
         * Seeks to the first note.
         *
         * @memberof ChartManager
         */
        firstNote(): void;
        /**
         * Seeks to the last note.
         *
         * @memberof ChartManager
         */
        lastNote(): void;
        private truncateHold;
        /**
         * Places/removes a note at the specified beat and column
         *
         * @param {number} col - The column to place the note at
         * @param {("mouse" | "key")} type - The input type
         * @param {number} [beat] - The beat to place the note at. Defaults to the current beat.
         * @memberof ChartManager
         */
        setNote(col: number, type: "mouse" | "key", beat?: number): void;
        /**
         * Extends the hold in the specified column to the current beat
         *
         * @param {number} col - The column of the hold.
         * @param {number} beat - The beat to extend to
         * @param {boolean} roll - Whether to convert holds into rolls
         * @memberof ChartManager
         */
        editHoldBeat(col: number, beat: number, roll: boolean): void;
        /**
         * Stops editing in a column
         *
         * @param {number} col
         * @memberof ChartManager
         */
        endEditing(col: number): void;
        previousNoteType(): void;
        nextNoteType(): void;
        getEditingNoteType(): NoteType | null;
        setEditingNoteType(type: NoteType): void;
        /**
         * Gets the current mode.
         *
         * @return {*}  {EditMode}
         * @memberof ChartManager
         */
        getMode(): EditMode;
        /**
         * Sets the current mode to the specified mode.
         *
         * @param {EditMode} mode
         * @memberof ChartManager
         */
        setMode(mode: EditMode): void;
        /**
         * Judges a key down on a certain column.
         * Places notes if the current mode is Record Mode.
         * @param {number} col
         * @memberof ChartManager
         */
        judgeCol(col: number): void;
        /**
         * Judges a key up on a certain column.
         *
         * @param {number} col
         * @memberof ChartManager
         */
        judgeColUp(col: number): void;
        /**
         * Saves the current chart to disk.
         *
         * @memberof ChartManager
         */
        save(): Promise<void>;
        getDataPath(): string;
        getSMPath(ext: string): string;
        removeAutosaves(): Promise<void>;
        /**
         * Autosaves the current chart to disk.
         *
         * @memberof ChartManager
         */
        autosave(): Promise<void>;
        hasSelection(): boolean;
        hasNoteSelection(): boolean;
        hasEventSelection(): boolean;
        hasRange(): boolean;
        /**
         * Clears the current selection
         *
         * @memberof ChartManager
         */
        clearSelections(): void;
        startDragSelection(): void;
        endDragSelection(): void;
        startDragEventSelection(): void;
        endDragEventSelection(): void;
        addNoteToDragSelection(note: NotedataEntry): void;
        removeNoteFromDragSelection(note: NotedataEntry): void;
        addEventToDragSelection(event: Cached<TimingEvent>): void;
        removeEventFromDragSelection(event: Cached<TimingEvent>): void;
        addNoteToSelection(note: NotedataEntry): void;
        removeNoteFromSelection(note: NotedataEntry): void;
        setNoteSelection(notes: NotedataEntry[]): void;
        addEventToSelection(event: Cached<TimingEvent>): void;
        removeEventFromSelection(event: Cached<TimingEvent>): void;
        setEventSelection(notes: Cached<TimingEvent>[]): void;
        isNoteInSelection(note: NotedataEntry): boolean;
        isEventInSelection(event: Cached<TimingEvent>): boolean;
        private addNoteSelection;
        private removeNoteSelection;
        private getNoteSelectionIndex;
        private addEventSelection;
        private removeEventSelection;
        private getEventSelectionIndex;
        selectRegion(): void;
        modifySelection(modify: (note: NotedataEntry) => PartialNotedataEntry, clear?: boolean): void;
        private checkConflicts;
        modifyEventSelection(modify: (event: Cached<TimingEvent>) => TimingEvent): void;
        deleteSelection(): void;
        deleteEventSelection(): void;
        paste(data: string, clear?: boolean): void;
        pasteNotes(data: string, clear?: boolean): boolean;
        insertNotes(notes: PartialNotedata, clear?: boolean): void;
        pasteTempo(data: string): boolean;
        copy(): string | undefined;
    }
}
declare module "app/src/gui/element/MenubarManager" {
    import { App } from "app/src/App";
    export function Menubar(props: {
        app: App;
    }): React.JSX.Element;
}
declare module "app/src/gui/element/PlaybackOptions" {
    export function PlaybackOptions(): import("react/jsx-runtime").JSX.Element;
}
declare module "app/src/App" {
    import { Container, Renderer } from "pixi.js";
    import "tippy.js/animations/scale-subtle.css";
    import "tippy.js/dist/tippy.css";
    import { ChartManager } from "app/src/chart/ChartManager";
    import { GameTypeRegistry } from "app/src/chart/gameTypes/GameTypeRegistry";
    import { NoteskinRegistry } from "app/src/chart/gameTypes/noteskin/NoteskinRegistry";
    import { WindowManager } from "app/src/gui/window/WindowManager";
    import { ActionHistory } from "app/src/util/ActionHistory";
    import { EventHandler } from "app/src/util/EventHandler";
    import { Options } from "app/src/util/Options";
    import { Themes } from "app/src/util/Theme";
    global {
        interface Window {
            app: App;
            GameTypeRegistry: GameTypeRegistry;
            NoteskinRegistry: NoteskinRegistry;
        }
        interface File {
            path?: string;
        }
        interface HTMLInputElement {
            nwsaveas?: string;
            nwworkingdir?: string;
        }
    }
    export class App {
        readonly VERSION = "1.4.1";
        readonly options: typeof Options;
        readonly events: typeof EventHandler;
        readonly themes: typeof Themes;
        readonly renderer: Renderer;
        readonly stage: Container;
        readonly view: HTMLCanvasElement;
        readonly chartManager: ChartManager;
        readonly windowManager: WindowManager;
        readonly actionHistory: ActionHistory;
        capturing: boolean;
        STAGE_HEIGHT: number;
        STAGE_WIDTH: number;
        private lastWidth;
        private lastHeight;
        constructor();
        registerFonts(): void;
        registerListeners(): void;
        onResize(screenWidth: number, screenHeight: number): void;
        updateSize(): void;
        getCanvasHeight(): number;
        checkAppVersion(): void;
        checkCoreVersion(): void;
    }
}
declare module "app/src/util/custom-script/CustomScriptUtils" {
    import { Simfile } from "app/src/chart/sm/Simfile";
    export function createSMPayload(sm: Simfile): any;
    export function createSMFromPayload(payload: any): Promise<Simfile>;
    export function applyPayloadToSM(sm: Simfile, payload: any): Simfile;
}
declare module "app/src/util/custom-script/CustomScriptRunner" {
    import { App } from "app/src/App";
    import { CustomScript } from "app/src/util/custom-script/CustomScriptTypes";
    export class CustomScriptRunner {
        static run(app: App, script: CustomScript, args: any): Promise<unknown>;
    }
}
declare module "app/src/util/custom-script/CustomScriptWorker" { }
interface SecureFileSystemFileHandle extends FileSystemHandle {
    readonly kind: "file";
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle) */
    createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/createWritable) */
    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/getFile) */
    getFile(): Promise<File>;
}
interface FileSystemSyncAccessHandle {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/close) */
    close(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/flush) */
    flush(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/getSize) */
    getSize(): number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/read) */
    read(buffer: AllowSharedBufferSource, options?: FileSystemReadWriteOptions): number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/truncate) */
    truncate(newSize: number): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/write) */
    write(buffer: AllowSharedBufferSource, options?: FileSystemReadWriteOptions): number;
}
interface FileSystemReadWriteOptions {
    at?: number;
}
declare function getDirectoryHandle(path: string, options?: FileSystemGetFileOptions, dir?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | undefined>;
declare function getFileHandle(path: string, options?: FileSystemGetFileOptions): Promise<SecureFileSystemFileHandle | undefined>;
declare function resolvePath(path: string): string;
declare module "embed/src/Embed" {
    import "tippy.js/animations/scale-subtle.css";
    import "tippy.js/dist/tippy.css";
}
