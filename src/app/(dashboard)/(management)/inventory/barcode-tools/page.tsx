'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Input,
  Select,
  Space,
  Tabs,
  Typography,
  message,
} from 'antd'
import { CameraOutlined, CopyOutlined, QrcodeOutlined } from '@ant-design/icons'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { Html5Qrcode } from 'html5-qrcode'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import { searchVariants, type ProductVariantPojo } from '@/services/rest-api/app-api/products/product-service'

const { Title, Text, Paragraph } = Typography

const READER_ELEMENT_ID = 'barcode-tools-camera-reader'

function pickScanPayload(v: ProductVariantPojo): string {
  const b = (v.barcode ?? '').trim()
  if (b.length > 0) return b
  return (v.sku ?? '').trim()
}

export default function BarcodeToolsPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [variantId, setVariantId] = useState<number | undefined>()
  const [manualText, setManualText] = useState('')
  const [activeTab, setActiveTab] = useState('display')
  const [lastScan, setLastScan] = useState('')
  const [cameraOn, setCameraOn] = useState(false)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const { data: variantsResponse } = useAxiosSWR(
    [SWR_KEYS.VARIANT_LIST, 'barcode-tools'],
    async () => searchVariants({ pageIndex: 0, pageSize: 800, active: true }),
    { revalidateOnMount: true },
  )
  const variants = useMemo(() => variantsResponse?.items ?? [], [variantsResponse])

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === variantId),
    [variants, variantId],
  )

  const encodeValue = useMemo(() => {
    const manual = manualText.trim()
    if (manual.length > 0) return manual
    if (selectedVariant) return pickScanPayload(selectedVariant)
    return ''
  }, [manualText, selectedVariant])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !encodeValue) {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }
    let cancelled = false
    QRCode.toCanvas(canvas, encodeValue, { width: 260, margin: 2, errorCorrectionLevel: 'M' }).catch(() => {
      if (!cancelled) messageApi.error('Không tạo được mã QR')
    })
    return () => {
      cancelled = true
    }
  }, [encodeValue, messageApi])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !encodeValue) {
      if (svg) svg.replaceChildren()
      return
    }
    try {
      JsBarcode(svg, encodeValue, {
        format: 'CODE128',
        displayValue: true,
        margin: 12,
        height: 72,
        width: 2,
        fontSize: 14,
      })
    } catch {
      svg.replaceChildren()
      messageApi.warning('Chuỗi không vẽ được barcode vạch (thử QR hoặc rút ngắn ký tự đặc biệt).')
    }
  }, [encodeValue, messageApi])

  const disposeScanner = useCallback(async () => {
    const s = scannerRef.current
    scannerRef.current = null
    if (!s) return
    try {
      await s.stop()
      s.clear()
    } catch {
      /* ignore */
    }
  }, [])

  const stopScanner = useCallback(async () => {
    await disposeScanner()
    setCameraOn(false)
  }, [disposeScanner])

  const startScanner = useCallback(async () => {
    await disposeScanner()
    setCameraOn(false)
    const html5 = new Html5Qrcode(READER_ELEMENT_ID, { verbose: false })
    scannerRef.current = html5
    try {
      await html5.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          setLastScan(decodedText)
          messageApi.success(`Đã quét: ${decodedText}`)
        },
        () => {},
      )
      setCameraOn(true)
    } catch (e) {
      scannerRef.current = null
      try {
        html5.clear()
      } catch {
        /* ignore */
      }
      messageApi.error(
        (e as Error)?.message ||
          'Không bật được camera. Kiểm tra HTTPS, quyền trình duyệt, hoặc thử trình duyệt khác.',
      )
    }
  }, [disposeScanner, messageApi])

  useEffect(() => {
    return () => {
      void disposeScanner()
    }
  }, [disposeScanner])

  const handleTabChange = (key: string) => {
    if (activeTab === 'scan' && key !== 'scan') {
      void stopScanner()
    }
    setActiveTab(key)
  }

  const copyText = async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success('Đã copy')
    } catch {
      messageApi.error('Không copy được (trình duyệt chặn clipboard)')
    }
  }

  const variantOptions = useMemo(
    () =>
      variants.map((v) => ({
        value: v.id!,
        label: `${v.sku ?? ''} · ${v.productName ?? ''}${v.barcode ? ` · BC:${v.barcode}` : ''}`,
      })),
    [variants],
  )

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho' }, { title: 'Mã vạch và quét' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>
          Mã vạch và quét
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Hiển thị QR và barcode vạch để in hoặc quét bằng điện thoại; hoặc bật camera trên điện thoại để quét nhãn hàng
          thật (cần HTTPS trừ localhost).
        </Paragraph>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'display',
              label: (
                <span>
                  <QrcodeOutlined /> Hiển thị mã
                </span>
              ),
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message="Chuỗi dùng để in mã"
                    description="Ưu tiên ô tùy chỉnh bên dưới; nếu để trống thì dùng barcode variant (nếu có), không thì SKU — giống logic khi nhập kho PO."
                  />
                  <Space wrap style={{ width: '100%' }}>
                    <Select
                      showSearch
                      allowClear
                      placeholder="Chọn biến thể"
                      style={{ minWidth: 360 }}
                      options={variantOptions}
                      optionFilterProp="label"
                      value={variantId}
                      onChange={(v) => setVariantId(v)}
                    />
                    <Input
                      style={{ maxWidth: 420 }}
                      placeholder="Hoặc nhập chuỗi bất kỳ (ghi đè variant)"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      allowClear
                    />
                  </Space>
                  {selectedVariant && (
                    <Text type="secondary">
                      Đang chọn: <Text strong>{selectedVariant.productName}</Text> — SKU{' '}
                      <Text code>{selectedVariant.sku}</Text>
                      {selectedVariant.barcode ? (
                        <>
                          {' '}
                          · Barcode <Text code>{selectedVariant.barcode}</Text>
                        </>
                      ) : null}
                    </Text>
                  )}
                  {!encodeValue ? (
                    <Text type="warning">Chọn biến thể hoặc nhập chuỗi để hiển thị mã.</Text>
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Giá trị mã hóa:</Text>{' '}
                        <Text code copyable>
                          {encodeValue}
                        </Text>{' '}
                        <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyText(encodeValue)}>
                          Copy
                        </Button>
                      </div>
                      <Space align="start" wrap size="large">
                        <Card size="small" title="QR (dễ quét bằng điện thoại)">
                          <canvas ref={canvasRef} />
                        </Card>
                        <Card size="small" title="Barcode vạch (CODE128)">
                          <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
                        </Card>
                      </Space>
                    </Space>
                  )}
                </Space>
              ),
            },
            {
              key: 'scan',
              label: (
                <span>
                  <CameraOutlined /> Quét bằng camera
                </span>
              ),
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Alert
                    type="warning"
                    showIcon
                    message="Quyền camera"
                    description="Dùng Chrome/Safari trên điện thoại; bật HTTPS trên môi trường thật. Nút Bật camera sẽ xin quyền."
                  />
                  <Space wrap>
                    <Button type="primary" onClick={() => void startScanner()} disabled={cameraOn}>
                      Bật camera
                    </Button>
                    <Button danger onClick={() => void stopScanner()} disabled={!cameraOn}>
                      Dừng camera
                    </Button>
                  </Space>
                  <div
                    id={READER_ELEMENT_ID}
                    style={{
                      minHeight: 280,
                      maxWidth: 400,
                      margin: '0 auto',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  />
                  {lastScan ? (
                    <Card size="small" title="Kết quả quét gần nhất">
                      <Space direction="vertical">
                        <Text code style={{ fontSize: 16, wordBreak: 'break-all' }}>
                          {lastScan}
                        </Text>
                        <Button icon={<CopyOutlined />} onClick={() => copyText(lastScan)}>
                          Copy kết quả
                        </Button>
                      </Space>
                    </Card>
                  ) : (
                    <Text type="secondary">Chưa có kết quả quét.</Text>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </>
  )
}
