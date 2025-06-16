
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { FileText, Download } from 'lucide-react';
import { format, subMonths, subYears, isToday } from 'date-fns';

const ReportsExport = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [reportType, setReportType] = useState<'daily' | 'range'>('daily');

  const setPredefinedPeriod = (period: string) => {
    const today = new Date();
    let from = new Date();
    
    if (period === 'daily') {
      setReportType('daily');
      setDateRange({ from: today, to: today });
      setSelectedPeriod('daily');
      return;
    }

    setReportType('range');
    
    switch (period) {
      case '1month':
        from = subMonths(today, 1);
        break;
      case '2months':
        from = subMonths(today, 2);
        break;
      case '6months':
        from = subMonths(today, 6);
        break;
      case '1year':
        from = subYears(today, 1);
        break;
      default:
        return;
    }
    
    setDateRange({ from, to: today });
    setSelectedPeriod(period);
  };

  const getFilteredBookings = () => {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    if (reportType === 'daily') {
      return bookings.filter((booking: any) => {
        const checkInDate = new Date(booking.checkInDate);
        return format(checkInDate, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
      });
    }
    
    return bookings.filter((booking: any) => {
      const checkInDate = new Date(booking.checkInDate);
      return checkInDate >= dateRange.from && checkInDate <= dateRange.to;
    });
  };

  const getDailyStats = () => {
    const bookings = getFilteredBookings();
    const totalRevenue = bookings.reduce((sum: number, booking: any) => sum + booking.farePerNight, 0);
    const totalAdvance = bookings.reduce((sum: number, booking: any) => sum + booking.advancePayment, 0);
    const totalPending = bookings.reduce((sum: number, booking: any) => sum + booking.remainingPayment, 0);
    const totalGuests = bookings.reduce((sum: number, booking: any) => sum + booking.totalGuests, 0);
    
    return {
      totalBookings: bookings.length,
      totalRevenue,
      totalAdvance,
      totalPending,
      totalGuests,
      occupancyRate: 0 // This would need room configuration
    };
  };

  const exportToPDF = () => {
    const bookings = getFilteredBookings();
    
    if (bookings.length === 0) {
      toast({
        title: "No Data",
        description: "No bookings found for the selected date range",
        variant: "destructive"
      });
      return;
    }

    const stats = getDailyStats();
    const reportTitle = reportType === 'daily' 
      ? `Daily Report - ${format(dateRange.from, 'MMM dd, yyyy')}`
      : `Report - ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')}`;

    // Create a comprehensive HTML content for PDF export
    const htmlContent = `
      <html>
        <head>
          <title>GuestFlow Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #333; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GuestFlow Hotel Management Report</h1>
            <h2>${reportTitle}</h2>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${stats.totalBookings}</div>
              <div class="stat-label">Total Bookings</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">₹${stats.totalRevenue.toLocaleString()}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">₹${stats.totalAdvance.toLocaleString()}</div>
              <div class="stat-label">Total Advance</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">₹${stats.totalPending.toLocaleString()}</div>
              <div class="stat-label">Pending Payment</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalGuests}</div>
              <div class="stat-label">Total Guests</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Room No.</th>
                <th>Guest Name</th>
                <th>Mobile</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Total Fare</th>
                <th>Advance</th>
                <th>Remaining</th>
                <th>Guests</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map((booking: any) => `
                <tr>
                  <td>${booking.roomNumber}</td>
                  <td>${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}</td>
                  <td>${booking.primaryGuest.mobile}</td>
                  <td>${booking.checkInDate} ${booking.checkInTime}</td>
                  <td>${booking.checkOutDate} ${booking.checkOutTime}</td>
                  <td>₹${booking.farePerNight}</td>
                  <td>₹${booking.advancePayment}</td>
                  <td>₹${booking.remainingPayment}</td>
                  <td>${booking.totalGuests}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guestflow-${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Report exported as HTML file (can be printed as PDF)"
    });
  };

  const exportToExcel = () => {
    const bookings = getFilteredBookings();
    
    if (bookings.length === 0) {
      toast({
        title: "No Data",
        description: "No bookings found for the selected date range",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const headers = [
      'Room Number',
      'Guest Name',
      'Mobile',
      'DOB',
      'Address',
      'Identity Proof',
      'Check-in Date',
      'Check-in Time',
      'Check-out Date',
      'Check-out Time',
      'Fare per Night',
      'Advance Payment',
      'Remaining Payment',
      'Total Guests'
    ];

    const csvContent = [
      headers.join(','),
      ...bookings.map((booking: any) => [
        booking.roomNumber,
        `"${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}"`,
        booking.primaryGuest.mobile,
        booking.primaryGuest.dob,
        `"${booking.primaryGuest.address}"`,
        booking.primaryGuest.identityProof,
        booking.checkInDate,
        booking.checkInTime,
        booking.checkOutDate,
        booking.checkOutTime,
        booking.farePerNight,
        booking.advancePayment,
        booking.remainingPayment,
        booking.totalGuests
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guestflow-${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Report exported as CSV file"
    });
  };

  const stats = getDailyStats();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Reports & Export</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Report Type & Date Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={selectedPeriod === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPredefinedPeriod('daily')}
                >
                  Daily Report
                </Button>
                <Button
                  variant={reportType === 'range' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setReportType('range');
                    setSelectedPeriod('custom');
                  }}
                >
                  Date Range
                </Button>
              </div>
            </div>

            {reportType === 'range' && (
              <div>
                <Label>Quick Select</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={selectedPeriod === '1month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPredefinedPeriod('1month')}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant={selectedPeriod === '2months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPredefinedPeriod('2months')}
                  >
                    2 Months
                  </Button>
                  <Button
                    variant={selectedPeriod === '6months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPredefinedPeriod('6months')}
                  >
                    6 Months
                  </Button>
                  <Button
                    variant={selectedPeriod === '1year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPredefinedPeriod('1year')}
                  >
                    1 Year
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label>Date Selection</Label>
              <div className="grid grid-cols-1 gap-4 mt-2">
                {reportType === 'daily' ? (
                  <div>
                    <Label className="text-sm">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => {
                        if (date) {
                          setDateRange({ from: date, to: date });
                        }
                      }}
                      className="rounded-md border"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">From Date</Label>
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange(prev => ({ ...prev, from: date }));
                            setSelectedPeriod('custom');
                          }
                        }}
                        className="rounded-md border"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">To Date</Label>
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange(prev => ({ ...prev, to: date }));
                            setSelectedPeriod('custom');
                          }
                        }}
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Export */}
        <Card>
          <CardHeader>
            <CardTitle>
              {reportType === 'daily' ? 'Daily Statistics' : 'Period Statistics'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Selected Period</Label>
              <p className="text-sm text-muted-foreground">
                {reportType === 'daily' 
                  ? format(dateRange.from, 'MMM dd, yyyy')
                  : `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Bookings</Label>
                <p className="text-2xl font-bold text-primary">{stats.totalBookings}</p>
              </div>
              <div>
                <Label>Total Guests</Label>
                <p className="text-2xl font-bold text-primary">{stats.totalGuests}</p>
              </div>
              <div>
                <Label>Total Revenue</Label>
                <p className="text-xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <Label>Pending Amount</Label>
                <p className="text-xl font-bold text-red-600">₹{stats.totalPending.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={exportToPDF}
                className="w-full"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF/HTML
              </Button>
              <Button
                onClick={exportToExcel}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as Excel/CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Room</th>
                  <th className="border border-gray-300 p-2 text-left">Guest</th>
                  <th className="border border-gray-300 p-2 text-left">Mobile</th>
                  <th className="border border-gray-300 p-2 text-left">Check-in</th>
                  <th className="border border-gray-300 p-2 text-left">Check-out</th>
                  <th className="border border-gray-300 p-2 text-left">Amount</th>
                  <th className="border border-gray-300 p-2 text-left">Guests</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredBookings().slice(0, 10).map((booking: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{booking.roomNumber}</td>
                    <td className="border border-gray-300 p-2">
                      {booking.primaryGuest.firstName} {booking.primaryGuest.lastName}
                    </td>
                    <td className="border border-gray-300 p-2">{booking.primaryGuest.mobile}</td>
                    <td className="border border-gray-300 p-2">
                      {booking.checkInDate} {booking.checkInTime}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {booking.checkOutDate} {booking.checkOutTime}
                    </td>
                    <td className="border border-gray-300 p-2">₹{booking.farePerNight}</td>
                    <td className="border border-gray-300 p-2">{booking.totalGuests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFilteredBookings().length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing first 10 records. Total: {getFilteredBookings().length}
              </p>
            )}
            {getFilteredBookings().length === 0 && (
              <p className="text-center text-gray-500 py-4">No bookings found for selected period</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsExport;
