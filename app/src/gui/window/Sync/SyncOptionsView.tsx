import { Dispatch, SetStateAction } from "react"
import { DisplaySliderInput } from "../../inputs/DisplaySliderInput"
import { SyncLabel } from "./SyncLabel"

export interface SyncOptions {
  fftSize: number
  windowStep: number
  tempoFftSize: number
  tempoStep: number
}

export function SyncOptionsView(props: {
  syncOptions: SyncOptions
  setSyncOptions: Dispatch<SetStateAction<SyncOptions>>
}) {
  return (
    <div
      className="flex-column-full"
      style={{ position: "relative", gap: "0.2rem" }}
    >
      <div style={{ fontWeight: "600" }}>Onsets</div>
      <SyncLabel
        text="FFT Size"
        tooltip="Controls the onset detection sensitivity. Higher values result in more detected onsets."
      >
        <DisplaySliderInput
          min={Math.log2(128)}
          max={Math.log2(8192)}
          step={1}
          value={props.syncOptions.fftSize}
          transformers={{
            serialize: v => Math.log2(v),
            deserialize: v => 2 ** v,
            display: v => v.toString(),
          }}
          onChange={value => {
            props.setSyncOptions(prev => ({
              ...prev,
              fftSize: value,
              windowStep: Math.min(prev.windowStep, value),
            }))
          }}
        />
      </SyncLabel>
      <SyncLabel
        text="Window Step"
        tooltip="Determines the number of blocks per second. Lower values result in more time-accurate spectrograms, but may take more time and mess up tempo analysis. Defaults to 512 and must be lower than FFT Size."
      >
        <DisplaySliderInput
          min={Math.log2(128)}
          max={Math.log2(8192)}
          step={1}
          value={props.syncOptions.windowStep}
          transformers={{
            serialize: v => Math.log2(v),
            deserialize: v => 2 ** v,
            display: v => v.toString(),
          }}
          onChange={value => {
            props.setSyncOptions(prev => ({
              ...prev,
              windowStep: Math.min(prev.fftSize, value),
            }))
          }}
        />
      </SyncLabel>
      <div style={{ fontWeight: "600", marginTop: "1rem" }}>Tempo</div>
      <SyncLabel
        text="FFT Size"
        tooltip="Determines the amount of the onset graph to analyze at every block. Higher values result in more accurate tempos, while lower values result in more accurate timings. Defaults to 4096."
      >
        <DisplaySliderInput
          min={Math.log2(128)}
          max={Math.log2(8192)}
          step={1}
          value={props.syncOptions.tempoFftSize}
          transformers={{
            serialize: v => Math.log2(v),
            deserialize: v => 2 ** v,
            display: v => v.toString(),
          }}
          onChange={value => {
            props.setSyncOptions(prev => ({
              ...prev,
              tempoFftSize: value,
              tempoStep: Math.min(prev.tempoStep, value),
            }))
          }}
        />
      </SyncLabel>
      <SyncLabel
        text="Window Step"
        tooltip="Determines the number of blocks per second. Lower values result in more time-accurate tempograms, but may take more time. Defaults to 2 and must be lower than FFT Size."
      >
        <DisplaySliderInput
          min={Math.log2(1)}
          max={Math.log2(1024)}
          step={1}
          value={props.syncOptions.tempoStep}
          transformers={{
            serialize: v => Math.log2(v),
            deserialize: v => 2 ** v,
            display: v => v.toString(),
          }}
          onChange={value => {
            props.setSyncOptions(prev => ({
              ...prev,
              tempoStep: Math.min(value, prev.tempoFftSize),
            }))
          }}
        />
      </SyncLabel>
    </div>
  )
}
