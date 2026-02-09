# React + TypeScript + Vite + shadcn/ui

This is a template for a new Vite project with React, TypeScript, and shadcn/ui.


<div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground mt-2">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={logout.isPending}>
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <p className="text-muted-foreground">
            Your dashboard content will go here. This is a placeholder for the main application.
          </p>
        </div>