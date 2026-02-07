{{- define "ton3s.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "ton3s.fullname" -}}
{{- .Release.Name -}}
{{- end -}}

{{- define "ton3s.labels" -}}
app.kubernetes.io/name: {{ include "ton3s.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "ton3s.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ton3s.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "ton3s.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ton3s.name" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
